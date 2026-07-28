import Dexie, { type EntityTable } from 'dexie'
import type { Playlist, SmartPlaylist, Track } from '../../types/model'

export interface FileRecord {
  key: string
  blob: Blob
}

export interface ArtworkRecord {
  key: string
  blob: Blob
}

export interface FavoriteRecord {
  trackId: string
  addedAt: number
}

export interface RecentRecord {
  trackId: string
  playedAt: number
}

/**
 * One row per play, append-only — the raw material for listening stats.
 * Composer/work/duration are denormalized at write time so aggregation never
 * depends on track snapshots that may have been pruned.
 */
export interface PlayRecord {
  id?: number
  trackId: string
  composer: string
  work: string
  durationSec: number
  playedAt: number
}

/** Generic JSON cache (e.g. the parsed catalog, for instant cold starts). */
export interface CacheRecord {
  key: string
  value: unknown
  savedAt: number
}

/**
 * A saved position inside a movement ("Act 2, where I stopped"). Title,
 * work and composer are denormalized so the row still renders if the track
 * snapshot is ever pruned.
 */
export interface BookmarkRecord {
  id: string
  trackId: string
  positionSec: number
  title: string
  work?: string
  composer: string
  createdAt: number
}

/**
 * Local database.
 * - `tracks` holds metadata for BOTH sources: the local library index, plus
 *   snapshots of Jamendo tracks that were playlisted/favorited so those views
 *   render offline without re-fetching.
 * - Audio/artwork blobs live in separate tables so listing the library never
 *   deserializes file bytes.
 */
export const db = new Dexie('music-player') as Dexie & {
  tracks: EntityTable<Track, 'id'>
  files: EntityTable<FileRecord, 'key'>
  artwork: EntityTable<ArtworkRecord, 'key'>
  playlists: EntityTable<Playlist, 'id'>
  favorites: EntityTable<FavoriteRecord, 'trackId'>
  recentlyPlayed: EntityTable<RecentRecord, 'trackId'>
  plays: EntityTable<PlayRecord, 'id'>
  cache: EntityTable<CacheRecord, 'key'>
  smartPlaylists: EntityTable<SmartPlaylist, 'id'>
  bookmarks: EntityTable<BookmarkRecord, 'id'>
}

db.version(1).stores({
  tracks: 'id, source, title, artist, album, addedAt',
  files: 'key',
  artwork: 'key',
  playlists: 'id, name, updatedAt',
  favorites: 'trackId, addedAt',
  recentlyPlayed: 'trackId, playedAt',
})

db.version(2).stores({
  plays: '++id, playedAt',
})

db.version(3).stores({
  cache: 'key',
})

db.version(4).stores({
  smartPlaylists: 'id, name, updatedAt',
})

db.version(5).stores({
  bookmarks: 'id, createdAt',
})
