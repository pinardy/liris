import type { Track } from '../../types/model'
import { db, type BookmarkRecord } from './db'
import { ensureTrackSnapshot } from './snapshot'

export async function addBookmark(track: Track, positionSec: number): Promise<void> {
  await ensureTrackSnapshot(track)
  await db.bookmarks.put({
    id: crypto.randomUUID(),
    trackId: track.id,
    positionSec: Math.max(0, Math.floor(positionSec)),
    title: track.title,
    work: track.album,
    composer: track.artist,
    createdAt: Date.now(),
  })
}

export interface BookmarkEntry {
  bookmark: BookmarkRecord
  /** Absent only if the snapshot was pruned; the row renders but can't play. */
  track?: Track
}

export async function getBookmarks(): Promise<BookmarkEntry[]> {
  const bookmarks = await db.bookmarks.orderBy('createdAt').reverse().toArray()
  const ids = [...new Set(bookmarks.map((b) => b.trackId))]
  const tracks = await db.tracks.bulkGet(ids)
  const byId = new Map<string, Track>()
  tracks.forEach((t, i) => {
    if (t) byId.set(ids[i], t)
  })
  return bookmarks.map((bookmark) => ({ bookmark, track: byId.get(bookmark.trackId) }))
}

export async function removeBookmark(id: string): Promise<void> {
  await db.bookmarks.delete(id)
}
