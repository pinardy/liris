import type { Track } from '../../types/model'
import { db, type PlayRecord } from './db'
import { ensureTrackSnapshot, getTracksByIds } from './snapshot'

const MAX_RECENTS = 50
/** Years of listening at heavy use; a full-table scan of this stays instant. */
const MAX_PLAYS = 20_000

/** Wipe play history and the stats built from it (playlists/favorites are
 *  untouched). Used by the Settings "clear listening history" action. */
export async function clearListeningData(): Promise<void> {
  await db.transaction('rw', [db.recentlyPlayed, db.plays], async () => {
    await db.recentlyPlayed.clear()
    await db.plays.clear()
  })
}

export async function recordPlay(track: Track): Promise<void> {
  // Live radio streams have session-ish URLs and no fixed content — don't record.
  if (track.id.startsWith('radio:')) return
  await ensureTrackSnapshot(track)
  const now = Date.now()
  await db.recentlyPlayed.put({ trackId: track.id, playedAt: now })
  // Append to the play history (stats). Composer/work denormalized on purpose.
  await db.plays.add({
    trackId: track.id,
    composer: track.artist,
    work: track.album ?? track.title,
    durationSec: track.durationSec,
    playedAt: now,
  })
  const count = await db.recentlyPlayed.count()
  if (count > MAX_RECENTS) {
    const oldest = await db.recentlyPlayed
      .orderBy('playedAt')
      .limit(count - MAX_RECENTS)
      .toArray()
    await db.recentlyPlayed.bulkDelete(oldest.map((r) => r.trackId))
  }
  const playCount = await db.plays.count()
  if (playCount > MAX_PLAYS) {
    const oldestKeys = await db.plays
      .orderBy('playedAt')
      .limit(playCount - MAX_PLAYS)
      .primaryKeys()
    await db.plays.bulkDelete(oldestKeys)
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

export interface HistoryEntry {
  play: PlayRecord
  /** Present for every play recorded since recordPlay snapshots tracks;
   *  absent only if the snapshot was pruned — the row still renders from
   *  the play's denormalized fields, it just can't be replayed. */
  track?: Track
}

/** The full play log, newest first, joined to playable track snapshots. */
export async function getPlayHistory(limit = 500): Promise<HistoryEntry[]> {
  const plays = await db.plays.orderBy('playedAt').reverse().limit(limit).toArray()
  const ids = [...new Set(plays.map((p) => p.trackId))]
  const tracks = await db.tracks.bulkGet(ids)
  const byId = new Map<string, Track>()
  tracks.forEach((t, i) => {
    if (t) byId.set(ids[i], t)
  })
  return plays.map((play) => ({ play, track: byId.get(play.trackId) }))
}
