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

/**
 * Favorite (or unfavorite) a whole set of tracks at once — how a work is
 * hearted: all of its movements together. Adding keeps each track's existing
 * addedAt untouched and stamps newcomers with one shared timestamp, so the
 * work's movements stay adjacent in the by-date favorites list.
 */
export async function setFavorites(tracks: Track[], on: boolean): Promise<void> {
  if (!on) {
    await db.favorites.bulkDelete(tracks.map((t) => t.id))
    return
  }
  const now = Date.now()
  for (const track of tracks) {
    const existing = await db.favorites.get(track.id)
    if (existing) continue
    await ensureTrackSnapshot(track)
    await db.favorites.put({ trackId: track.id, addedAt: now })
  }
}
