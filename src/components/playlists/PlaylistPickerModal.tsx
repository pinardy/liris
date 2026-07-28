import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from '../../lib/toast'
import type { Track } from '../../types/model'
import {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
} from '../../services/db/playlists'
import Modal from '../common/Modal'
import { PlusIcon } from '../common/icons'

export default function PlaylistPickerModal({
  track,
  onClose,
}: {
  track: Track
  onClose: () => void
}) {
  const playlists = useLiveQuery(getPlaylists, [])
  const [newName, setNewName] = useState('')
  const [feedback, setFeedback] = useState<string>()

  async function pick(playlistId: string) {
    const added = await addTrackToPlaylist(playlistId, track)
    if (added) {
      toast('Added to playlist')
      onClose()
    } else setFeedback('Already in that playlist')
  }

  async function createAndAdd() {
    const name = newName.trim()
    if (!name) return
    const playlist = await createPlaylist(name)
    await addTrackToPlaylist(playlist.id, track)
    toast(`Added to “${playlist.name}”`)
    onClose()
  }

  return (
    <Modal title="Add to playlist" onClose={onClose}>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void createAndAdd()
        }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name"
          className="min-w-0 flex-1 rounded-md bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          aria-label="Create playlist and add track"
          className="flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          <PlusIcon width="14" height="14" />
          Create
        </button>
      </form>

      {feedback && <p className="mb-2 text-xs text-amber-400">{feedback}</p>}

      <div className="max-h-64 overflow-y-auto">
        {playlists?.length === 0 && (
          <p className="py-2 text-sm text-zinc-500">No playlists yet — create one above.</p>
        )}
        {playlists?.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void pick(p.id)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-800"
          >
            <span className="truncate">{p.name}</span>
            <span className="ml-2 shrink-0 text-xs text-zinc-500">
              {p.trackIds.length} tracks
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
