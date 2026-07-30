import Button from '../components/common/Button'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import { PlayIcon } from '../components/common/icons'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { usePlayerStore } from '../player/playerStore'
import { getTracksByTags } from '../services/jamendo/api'

/**
 * Jamendo's 'classical' tag is modern neoclassical rather than the canon, so it
 * lives here as a separate strand instead of being mixed in with the
 * public-domain repertoire.
 */
export default function Contemporary() {
  const state = useAsync(
    () => getTracksByTags(['classical', 'piano'], 50),
    [],
    true,
    'contemporary:piano',
  )
  const playQueue = usePlayerStore((s) => s.playQueue)
  const tracks = state.data

  return (
    <>
      <PageHeading title="Contemporary">
        {tracks && tracks.length > 0 && (
          <Button size="sm" onClick={() => playQueue(tracks, 0)}>
            <PlayIcon width="14" height="14" />
            Play all
          </Button>
        )}
      </PageHeading>
      <p className="mb-6 max-w-2xl text-sm text-zinc-400">
        Living composers and neoclassical piano, licensed under Creative Commons by
        independent artists on Jamendo.
      </p>

      {state.loading && <Spinner />}
      {state.error && <ErrorMessage error={state.error} />}
      {tracks &&
        (tracks.length > 0 ? (
          <TrackList tracks={tracks} onPlay={(i) => playQueue(tracks, i)} />
        ) : (
          <EmptyState title="No contemporary tracks found" />
        ))}
    </>
  )
}
