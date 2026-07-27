import type { Track } from '../../types/model'
import { db } from './db'
import { ensureTrackSnapshot, getTracksByIds } from './snapshot'

/** Returns the new favorite state. */
export async function toggleFavorite(track: Track): Promise<boolean> {
  const existing = await db.favorites.get(track.id)
  if (existing) {
    await db.favorites.delete(track.id)
    return false
  }
  await ensureTrackSnapshot(track)
  await db.favorites.put({ trackId: track.id, addedAt: Date.now() })
  return true
}

export async function getFavoriteTracks(): Promise<Track[]> {
  const favs = await db.favorites.orderBy('addedAt').reverse().toArray()
  return getTracksByIds(favs.map((f) => f.trackId))
}
