import type { Track } from '../../types/model'
import { db } from './db'

export function getFileBlob(key: string): Promise<Blob | undefined> {
  return db.files.get(key).then((r) => r?.blob)
}

export function getArtworkBlob(key: string): Promise<Blob | undefined> {
  return db.artwork.get(key).then((r) => r?.blob)
}

export function getLocalTracks(): Promise<Track[]> {
  return db.tracks.where('source').equals('local').sortBy('addedAt')
}

export async function addLocalTrack(
  track: Track,
  fileBlob: Blob,
  artworkBlob?: Blob,
): Promise<void> {
  await db.transaction('rw', [db.tracks, db.files, db.artwork], async () => {
    await db.files.put({ key: track.local!.fileKey, blob: fileBlob })
    if (artworkBlob && track.local?.artworkKey) {
      await db.artwork.put({ key: track.local.artworkKey, blob: artworkBlob })
    }
    await db.tracks.put(track)
  })
}

export async function deleteLocalTrack(track: Track): Promise<void> {
  await db.transaction('rw', [db.tracks, db.files, db.artwork], async () => {
    if (track.local?.fileKey) await db.files.delete(track.local.fileKey)
    if (track.local?.artworkKey) await db.artwork.delete(track.local.artworkKey)
    await db.tracks.delete(track.id)
  })
}

/** True if a local file with the same name+size fingerprint was already imported. */
export async function isDuplicateImport(fingerprint: string): Promise<boolean> {
  const existing = await db.files.get(fingerprint)
  return Boolean(existing)
}
