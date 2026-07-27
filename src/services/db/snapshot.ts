import type { Track } from '../../types/model'
import { db } from './db'

/**
 * Ensure a track's metadata is persisted in the `tracks` table so playlists,
 * favorites and recents render offline without hitting the Jamendo API.
 * Local tracks are already stored by the import pipeline.
 */
export async function ensureTrackSnapshot(track: Track): Promise<void> {
  const existing = await db.tracks.get(track.id)
  if (existing) return
  await db.tracks.put({ ...track, addedAt: track.addedAt || Date.now() })
}

/** Resolve a list of track ids to Tracks, preserving order and dropping missing ones. */
export async function getTracksByIds(ids: string[]): Promise<Track[]> {
  const rows = await db.tracks.bulkGet(ids)
  return rows.filter((t): t is Track => Boolean(t))
}
