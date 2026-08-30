import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import BackLink from '../components/common/BackLink'
import Button from '../components/common/Button'
import DetailHeader from '../components/common/DetailHeader'
import Modal from '../components/common/Modal'
import { EmptyState, Spinner } from '../components/common/Status'
import { PlayIcon, PlaylistIcon } from '../components/common/icons'
import TrackActions from '../components/tracks/TrackActions'
import TrackList from '../components/tracks/TrackList'
import { formatDuration } from '../lib/format'
import { toast } from '../lib/toast'
import { useConfirm } from '../hooks/useConfirm'
import { usePlayerStore } from '../player/playerStore'
import {
  addTrackToPlaylist,
  deletePlaylist,
  getPlaylistWithTracks,
  removeTrackFromPlaylist,
  renamePlaylist,
  reorderPlaylistTracks,
} from '../services/db/playlists'
import type { Track } from '../types/model'

export default function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // null = playlist not found; undefined = still loading
  const data = useLiveQuery(async () => (await getPlaylistWithTracks(id!)) ?? null, [id])
  const playQueue = usePlayerStore((s) => s.playQueue)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const { confirm, confirmDialog } = useConfirm()

  if (data === undefined) return <Spinner />
  if (data === null) {
    return (
      <EmptyState title="Playlist not found" action={{ label: 'All playlists', to: '/playlists' }}>
        It may have been deleted, or the link may be from another device.
      </EmptyState>
    )
  }

  const { playlist, tracks } = data
  const totalSec = tracks.reduce((sum, t) => sum + t.durationSec, 0)

  function handleDelete() {
    confirm({
      title: 'Delete playlist',
      message: (
        <>
          “{playlist.name}” and its {tracks.length} track
          {tracks.length === 1 ? '' : 's'} will be removed. This can't be undone.
        </>
      ),
      confirmLabel: 'Delete playlist',
      onConfirm: () => {
        void deletePlaylist(playlist.id).then(() => {
          toast(`Deleted “${playlist.name}”`)
          void navigate('/playlists')
        })
      },
    })
  }

  /** Remove with an Undo that puts the track back at the index it came from. */
  async function handleRemoveTrack(track: Track, index: number) {
    await removeTrackFromPlaylist(playlist.id, track.id)
    // Names the track: two removals in a row would otherwise produce identical
    // messages, and the first Undo would be collapsed away by the second.
    toast(`Removed “${track.title}” from “${playlist.name}”`, {
      action: {
        label: 'Undo',
        onClick: () => {
          void (async () => {
            const added = await addTrackToPlaylist(playlist.id, track)
            if (!added) return
            // addTrackToPlaylist appends, so read the list back rather than
            // trusting the length captured at removal time — the playlist may
            // have been edited while the Undo was on screen.
            const current = await getPlaylistWithTracks(playlist.id)
            const from = current ? current.playlist.trackIds.length - 1 : -1
            if (from > index) void reorderPlaylistTracks(playlist.id, from, index)
          })()
        },
      },
    })
  }

  return (
    <>
      <BackLink fallback="/playlists" fallbackLabel="Playlists" />
      <DetailHeader
        artwork={
          <div className="flex size-40 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 sm:size-48">
            <PlaylistIcon width="40%" height="40%" />
          </div>
        }
        eyebrow="Playlist"
        title={playlist.name}
      >
          <p className="mt-2 text-sm text-zinc-400">
            {tracks.length} track{tracks.length === 1 ? '' : 's'}
            {tracks.length > 0 && <>, {formatDuration(totalSec)}</>}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => playQueue(tracks, 0)} disabled={tracks.length === 0}>
              <PlayIcon width="16" height="16" />
              Play
            </Button>
            <Button
              variant="subtle"
              onClick={() => {
                setNewName(playlist.name)
                setRenaming(true)
              }}
            >
              Rename
            </Button>
            <Button variant="subtle" onClick={handleDelete}>
              Delete
            </Button>
          </div>
      </DetailHeader>

      {renaming && (
        <Modal title="Rename playlist" onClose={() => setRenaming(false)}>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newName.trim()) return
              void renamePlaylist(playlist.id, newName).then(() => {
                setRenaming(false)
                toast(`Renamed to “${newName.trim()}”`)
              })
            }}
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-md bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"
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
                  onClick: () =>
                    void handleRemoveTrack(
                      track,
                      tracks.findIndex((t) => t.id === track.id),
                    ),
                },
              ]}
            />
          )}
        />
      ) : (
        <EmptyState
          title="This playlist is empty"
          action={{ label: 'Find music to add', to: '/search' }}
        >
          Use the “···” menu on any track to add it here.
        </EmptyState>
      )}
      {confirmDialog}
    </>
  )
}
