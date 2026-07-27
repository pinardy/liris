import type { Track } from '../../types/model'
import { db } from './db'
import { ensureTrackSnapshot } from './snapshot'

/**
 * Offline downloads: fetch a remote track's audio into the same `files` table
 * the local library uses, keyed with a `dl:` prefix. resolveSource checks for
 * a downloaded blob before falling back to the network, so downloaded tracks
 * play offline transparently everywhere (queue, playlists, favorites).
 * Both Jamendo and archive.org serve audio with CORS headers (verified), so
 * fetch() works.
 */

const KEY_PREFIX = 'dl:'

export function downloadKey(trackId: string): string {
  return `${KEY_PREFIX}${trackId}`
}

export function isDownloadable(track: Track): boolean {
  if (track.id.startsWith('radio:')) return false
  return Boolean(track.jamendo?.audioUrl || track.archive?.audioUrl)
}

export async function downloadTrack(track: Track): Promise<void> {
  const url = track.jamendo?.audioUrl ?? track.archive?.audioUrl
  if (!url) throw new Error('Track has no downloadable stream')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`)
  const blob = await res.blob()
  if (navigator.storage?.persist) void navigator.storage.persist()
  await ensureTrackSnapshot(track)
  await db.files.put({ key: downloadKey(track.id), blob })
}

export async function removeDownload(trackId: string): Promise<void> {
  await db.files.delete(downloadKey(trackId))
}

/** Ids of all downloaded tracks — keys only, never deserializes the blobs. */
export async function getDownloadedIds(): Promise<Set<string>> {
  const keys = await db.files.where('key').startsWith(KEY_PREFIX).primaryKeys()
  return new Set(keys.map((k) => String(k).slice(KEY_PREFIX.length)))
}
