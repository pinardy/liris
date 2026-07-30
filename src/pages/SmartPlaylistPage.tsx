import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import SmartPlaylistModal from '../components/playlists/SmartPlaylistModal'
import Button from '../components/common/Button'
import DetailHeader from '../components/common/DetailHeader'
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
      <DetailHeader
        artwork={
          <div className="flex size-40 items-center justify-center rounded-lg bg-zinc-800 text-accent sm:size-48">
            <SparklesIcon width="40%" height="40%" />
          </div>
        }
        eyebrow="Smart playlist"
        title={playlist.name}
      >
          <p className="mt-2 text-sm text-zinc-400">
            {describeSmartRules(playlist.rules)} · {works.length}{' '}
            {works.length === 1 ? 'work' : 'works'} — updates as the catalog grows
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={() => playQueue(allTracks, 0)} disabled={allTracks.length === 0}>
              <PlayIcon width="16" height="16" />
              Play all
            </Button>
            <StartRadioButton groups={works.map(workTracks)} />
            <Button variant="subtle" onClick={() => setEditing(true)}>
              Edit rules
            </Button>
            <Button variant="subtle" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </div>
      </DetailHeader>

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
