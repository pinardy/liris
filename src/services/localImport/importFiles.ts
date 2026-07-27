import type { Track } from '../../types/model'
import { addLocalTrack, isDuplicateImport } from '../db/library'
import { downscaleArtwork, parseAudioMetadata } from './metadata'

export interface ImportProgress {
  total: number
  done: number
  currentFile?: string
}

export interface ImportResult {
  added: number
  skipped: number
  failed: number
  failures: string[]
}

const AUDIO_EXT = /\.(mp3|flac|m4a|aac|ogg|opus|wav|webm)$/i

function looksLikeAudio(file: File): boolean {
  return file.type.startsWith('audio/') || AUDIO_EXT.test(file.name)
}

/**
 * Import a batch of files sequentially (parallel parsing of a big folder
 * would spike memory) with progress reporting. Duplicates are detected by
 * a name+size fingerprint which doubles as the stored file key.
 */
export async function importFiles(
  fileList: FileList | File[],
  onProgress: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const files = Array.from(fileList).filter(looksLikeAudio)
  const result: ImportResult = { added: 0, skipped: 0, failed: 0, failures: [] }

  // Ask the browser to protect our storage from eviction (best-effort).
  if (navigator.storage?.persist) {
    void navigator.storage.persist()
  }

  let done = 0
  for (const file of files) {
    onProgress({ total: files.length, done, currentFile: file.name })
    try {
      const fingerprint = `${file.name}:${file.size}`
      if (await isDuplicateImport(fingerprint)) {
        result.skipped++
        continue
      }
      const meta = await parseAudioMetadata(file)
      const artworkBlob = meta.picture
        ? await downscaleArtwork(meta.picture.data, meta.picture.format)
        : undefined
      const id = `loc:${crypto.randomUUID()}`
      const track: Track = {
        id,
        source: 'local',
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        durationSec: meta.durationSec,
        local: {
          fileKey: fingerprint,
          artworkKey: artworkBlob ? `${id}:art` : undefined,
          mimeType: file.type || 'audio/mpeg',
          fileName: file.name,
        },
        addedAt: Date.now(),
      }
      await addLocalTrack(track, file, artworkBlob)
      result.added++
    } catch (err) {
      console.error(`Failed to import ${file.name}`, err)
      result.failed++
      result.failures.push(file.name)
    } finally {
      done++
      onProgress({ total: files.length, done })
    }
  }
  return result
}
