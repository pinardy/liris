import type { Track } from '../../types/model'
import { db } from './db'
import { ensureTrackSnapshot, getTracksByIds } from './snapshot'

const MAX_RECENTS = 50

export async function recordPlay(track: Track): Promise<void> {
  // Live radio streams have session-ish URLs and no fixed content — don't record.
  if (track.id.startsWith('radio:')) return
  await ensureTrackSnapshot(track)
  await db.recentlyPlayed.put({ trackId: track.id, playedAt: Date.now() })
  const count = await db.recentlyPlayed.count()
  if (count > MAX_RECENTS) {
    const oldest = await db.recentlyPlayed
      .orderBy('playedAt')
      .limit(count - MAX_RECENTS)
      .toArray()
    await db.recentlyPlayed.bulkDelete(oldest.map((r) => r.trackId))
  }
}

export async function getRecentTracks(limit = 10): Promise<Track[]> {
  const recents = await db.recentlyPlayed
    .orderBy('playedAt')
    .reverse()
    .limit(limit)
    .toArray()
  return getTracksByIds(recents.map((r) => r.trackId))
}
