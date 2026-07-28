import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import Modal from '../components/common/Modal'
import { EmptyState, Spinner } from '../components/common/Status'
import { PlayIcon, PlaylistIcon } from '../components/common/icons'
import TrackActions from '../components/tracks/TrackActions'
import TrackList from '../components/tracks/TrackList'
import { formatDuration } from '../lib/format'
import { usePlayerStore } from '../player/playerStore'
import {
  deletePlaylist,
  getPlaylistWithTracks,
  removeTrackFromPlaylist,
  renamePlaylist,
  reorderPlaylistTracks,
} from '../services/db/playlists'

export default function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // null = playlist not found; undefined = still loading
  const data = useLiveQuery(async () => (await getPlaylistWithTracks(id!)) ?? null, [id])
  const playQueue = usePlayerStore((s) => s.playQueue)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')

  if (data === undefined) return <Spinner />
  if (data === null) return <EmptyState title="Playlist not found" />

  const { playlist, tracks } = data
  const totalSec = tracks.reduce((sum, t) => sum + t.durationSec, 0)

  async function handleDelete() {
    if (!confirm(`Delete playlist “${playlist.name}”?`)) return
    await deletePlaylist(playlist.id)
    navigate('/playlists')
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
        <div className="flex size-40 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600 sm:size-48">
          <PlaylistIcon width="40%" height="40%" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Playlist
          </p>
          <h1 className="mt-1 break-words text-3xl font-extrabold md:text-4xl">
            {playlist.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {tracks.length} track{tracks.length === 1 ? '' : 's'}
            {tracks.length > 0 && <>, {formatDuration(totalSec)}</>}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => playQueue(tracks, 0)}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              <PlayIcon width="16" height="16" />
              Play
            </button>
            <button
              type="button"
              onClick={() => {
                setNewName(playlist.name)
                setRenaming(true)
              }}
              className="rounded-full border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-full border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {renaming && (
        <Modal title="Rename playlist" onClose={() => setRenaming(false)}>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newName.trim()) return
              void renamePlaylist(playlist.id, newName).then(() => setRenaming(false))
            }}
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-md bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="rounded-md bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              Save
            </button>
          </form>
        </Modal>
      )}

      {tracks.length > 0 ? (
        <TrackList
          tracks={tracks}
          onPlay={(i) => playQueue(tracks, i)}
          onReorder={(from, to) => void reorderPlaylistTracks(playlist.id, from, to)}
          renderActions={(track) => (
            <TrackActions
              track={track}
              extraActions={[
                {
                  label: 'Remove from playlist',
                  onClick: () => void removeTrackFromPlaylist(playlist.id, track.id),
                },
              ]}
            />
          )}
        />
      ) : (
        <EmptyState title="This playlist is empty">
          Use the “···” menu on any track to add it here.
        </EmptyState>
      )}
    </>
  )
}
