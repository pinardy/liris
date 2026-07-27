import Dexie, { type EntityTable } from 'dexie'
import type { Playlist, Track } from '../../types/model'

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
}

db.version(1).stores({
  tracks: 'id, source, title, artist, album, addedAt',
  files: 'key',
  artwork: 'key',
  playlists: 'id, name, updatedAt',
  favorites: 'trackId, addedAt',
  recentlyPlayed: 'trackId, playedAt',
})
