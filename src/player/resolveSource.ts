import type { Track } from '../types/model'

/**
 * Resolve a Track to a URL the audio element can play.
 * Jamendo tracks stream directly; local tracks are read from IndexedDB
 * and served via an object URL (which the engine must revoke on change).
 */
export async function resolvePlayableUrl(
  track: Track,
): Promise<{ url: string; isObjectUrl: boolean }> {
  // A downloaded copy takes priority over streaming — works offline.
  if (track.source !== 'local' && !track.id.startsWith('radio:')) {
    const [{ getFileBlob }, { downloadKey }] = await Promise.all([
      import('../services/db/library'),
      import('../services/db/downloads'),
    ])
    const blob = await getFileBlob(downloadKey(track.id))
    if (blob) return { url: URL.createObjectURL(blob), isObjectUrl: true }
  }
  if (track.source === 'jamendo') {
    if (!track.jamendo?.audioUrl) throw new Error('Track has no stream URL')
    return { url: track.jamendo.audioUrl, isObjectUrl: false }
  }
  if (track.source === 'archive') {
    if (!track.archive?.audioUrl) throw new Error('Track has no stream URL')
    return { url: track.archive.audioUrl, isObjectUrl: false }
  }
  // Local: loaded lazily so Dexie isn't pulled into the initial bundle path.
  const { getFileBlob } = await import('../services/db/library')
  if (!track.local?.fileKey) throw new Error('Track has no file reference')
  const blob = await getFileBlob(track.local.fileKey)
  if (!blob) throw new Error('Audio file missing from library storage')
  return { url: URL.createObjectURL(blob), isObjectUrl: true }
}

/** Resolve artwork for the Media Session / now-playing UI. */
export async function resolveArtworkUrl(track: Track): Promise<string | undefined> {
  if (track.artworkUrl) return track.artworkUrl
  if (track.source === 'local' && track.local?.artworkKey) {
    const { getArtworkBlob } = await import('../services/db/library')
    const blob = await getArtworkBlob(track.local.artworkKey)
    if (blob) return URL.createObjectURL(blob)
  }
  return undefined
}
