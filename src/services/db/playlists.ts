import type { Playlist, Track } from '../../types/model'
import { db } from './db'
import { ensureTrackSnapshot, getTracksByIds } from './snapshot'

export async function createPlaylist(name: string): Promise<Playlist> {
  const now = Date.now()
  const playlist: Playlist = {
    id: crypto.randomUUID(),
    name: name.trim() || 'New playlist',
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  }
  await db.playlists.put(playlist)
  return playlist
}

export function getPlaylists(): Promise<Playlist[]> {
  return db.playlists.orderBy('updatedAt').reverse().toArray()
}

export async function deletePlaylist(id: string): Promise<void> {
  await db.playlists.delete(id)
}

export async function renamePlaylist(id: string, name: string): Promise<void> {
  await db.playlists.update(id, { name: name.trim(), updatedAt: Date.now() })
}

/** Returns false if the track was already in the playlist. */
export async function addTrackToPlaylist(playlistId: string, track: Track): Promise<boolean> {
  const playlist = await db.playlists.get(playlistId)
  if (!playlist) throw new Error('Playlist not found')
  if (playlist.trackIds.includes(track.id)) return false
  await ensureTrackSnapshot(track)
  await db.playlists.update(playlistId, {
    trackIds: [...playlist.trackIds, track.id],
    updatedAt: Date.now(),
  })
  return true
}

/** Move the track at `from` to sit at `to`, mirroring queue reordering. */
export async function reorderPlaylistTracks(
  playlistId: string,
  from: number,
  to: number,
): Promise<void> {
  const playlist = await db.playlists.get(playlistId)
  if (!playlist || from === to) return
  if (from < 0 || to < 0 || from >= playlist.trackIds.length || to >= playlist.trackIds.length)
    return
  const trackIds = [...playlist.trackIds]
  const [moved] = trackIds.splice(from, 1)
  trackIds.splice(to, 0, moved)
  await db.playlists.update(playlistId, { trackIds, updatedAt: Date.now() })
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  const playlist = await db.playlists.get(playlistId)
  if (!playlist) return
  await db.playlists.update(playlistId, {
    trackIds: playlist.trackIds.filter((id) => id !== trackId),
    updatedAt: Date.now(),
  })
}

export async function getPlaylistWithTracks(
  id: string,
): Promise<{ playlist: Playlist; tracks: Track[] } | undefined> {
  const playlist = await db.playlists.get(id)
  if (!playlist) return undefined
  const tracks = await getTracksByIds(playlist.trackIds)
  return { playlist, tracks }
}
