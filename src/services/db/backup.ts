import type { Playlist, SmartPlaylist, Track } from '../../types/model'
import { db, type FavoriteRecord } from './db'

/**
 * Backup = playlists (regular and smart) + favorites + the non-local track
 * snapshots they need to render. Local files (audio blobs) are NOT included —
 * they're copies of the user's own files; playlist entries pointing at
 * missing local tracks are simply dropped at render time.
 */

interface BackupFile {
  app: 'liris'
  version: 1
  exportedAt: string
  playlists: Playlist[]
  /** Absent in backups written before smart playlists existed. */
  smartPlaylists?: SmartPlaylist[]
  favorites: FavoriteRecord[]
  tracks: Track[]
}

export async function exportBackup(): Promise<Blob> {
  const [playlists, smartPlaylists, favorites, tracks] = await Promise.all([
    db.playlists.toArray(),
    db.smartPlaylists.toArray(),
    db.favorites.toArray(),
    db.tracks.where('source').notEqual('local').toArray(),
  ])
  const backup: BackupFile = {
    app: 'liris',
    version: 1,
    exportedAt: new Date().toISOString(),
    playlists,
    smartPlaylists,
    favorites,
    tracks,
  }
  return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
}

export async function importBackup(
  file: File,
): Promise<{ playlists: number; favorites: number }> {
  const data = JSON.parse(await file.text()) as Partial<BackupFile>
  if (data.app !== 'liris' || !Array.isArray(data.playlists)) {
    throw new Error('Not a valid liris backup file')
  }
  await db.transaction(
    'rw',
    [db.tracks, db.playlists, db.smartPlaylists, db.favorites],
    async () => {
      await db.tracks.bulkPut(data.tracks ?? [])
      await db.playlists.bulkPut(data.playlists!)
      await db.smartPlaylists.bulkPut(data.smartPlaylists ?? [])
      await db.favorites.bulkPut(data.favorites ?? [])
    },
  )
  return {
    playlists: data.playlists.length + (data.smartPlaylists?.length ?? 0),
    favorites: data.favorites?.length ?? 0,
  }
}
