import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import SmartPlaylistModal from '../components/playlists/SmartPlaylistModal'
import StartRadioButton from '../components/common/StartRadioButton'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import { PlayIcon, SparklesIcon } from '../components/common/icons'
import WorkRow from '../components/classical/WorkRow'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { workTracks } from '../lib/classical'
import { describeSmartRules, evaluateSmartRules } from '../lib/smartRules'
import { usePlayerStore } from '../player/playerStore'
import {
  deleteSmartPlaylist,
  getSmartPlaylist,
  updateSmartPlaylist,
} from '../services/db/smartPlaylists'

export default function SmartPlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // null = not found; undefined = still loading
  const playlist = useLiveQuery(async () => (await getSmartPlaylist(id!)) ?? null, [id])
  const { data: index, error, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)
  const [editing, setEditing] = useState(false)

  if (playlist === undefined || loading) return <Spinner />
  if (playlist === null) return <EmptyState title="Smart playlist not found" />
  if (error) return <ErrorMessage error={error} />
  if (!index) return <EmptyState title="Catalog unavailable" />

  const works = evaluateSmartRules(playlist.rules, index)
  const allTracks = works.flatMap(workTracks)

  async function handleDelete() {
    if (!playlist || !confirm(`Delete smart playlist “${playlist.name}”?`)) return
    await deleteSmartPlaylist(playlist.id)
    navigate('/playlists')
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
        <div className="flex size-40 items-center justify-center rounded-lg bg-zinc-800 text-accent sm:size-48">
          <SparklesIcon width="40%" height="40%" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Smart playlist
          </p>
          <h1 className="mt-1 break-words text-3xl font-extrabold md:text-4xl">
            {playlist.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {describeSmartRules(playlist.rules)} · {works.length}{' '}
            {works.length === 1 ? 'work' : 'works'} — updates as the catalog grows
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => playQueue(allTracks, 0)}
              disabled={allTracks.length === 0}
              className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              <PlayIcon width="16" height="16" />
              Play all
            </button>
            <StartRadioButton groups={works.map(workTracks)} />
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Edit rules
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

      {editing && (
        <SmartPlaylistModal
          existing={playlist}
          onClose={() => setEditing(false)}
          onSave={(name, rules) => {
            void updateSmartPlaylist(playlist.id, { name, rules }).then(() =>
              setEditing(false),
            )
          }}
        />
      )}

      {works.length > 0 ? (
        <div className="flex flex-col">
          {works.map((work) => (
            <WorkRow key={work.id} work={work} showComposer />
          ))}
        </div>
      ) : (
        <EmptyState title="No works match these rules yet">
          Edit the rules to widen the net.
        </EmptyState>
      )}
    </>
  )
}
