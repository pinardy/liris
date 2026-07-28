import type { SmartPlaylist, SmartRules } from '../../types/model'
import { db } from './db'

export async function createSmartPlaylist(
  name: string,
  rules: SmartRules,
): Promise<SmartPlaylist> {
  const now = Date.now()
  const playlist: SmartPlaylist = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Smart playlist',
    rules,
    createdAt: now,
    updatedAt: now,
  }
  await db.smartPlaylists.put(playlist)
  return playlist
}

export function getSmartPlaylists(): Promise<SmartPlaylist[]> {
  return db.smartPlaylists.orderBy('updatedAt').reverse().toArray()
}

export function getSmartPlaylist(id: string): Promise<SmartPlaylist | undefined> {
  return db.smartPlaylists.get(id)
}

export async function updateSmartPlaylist(
  id: string,
  changes: { name?: string; rules?: SmartRules },
): Promise<void> {
  await db.smartPlaylists.update(id, { ...changes, updatedAt: Date.now() })
}

export async function deleteSmartPlaylist(id: string): Promise<void> {
  await db.smartPlaylists.delete(id)
}
