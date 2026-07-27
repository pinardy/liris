import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, Spinner } from '../components/common/Status'
import { PlayIcon } from '../components/common/icons'
import TrackList from '../components/tracks/TrackList'
import { usePlayerStore } from '../player/playerStore'
import { getFavoriteTracks } from '../services/db/favorites'

export default function Favorites() {
  const tracks = useLiveQuery(getFavoriteTracks, [])
  const playQueue = usePlayerStore((s) => s.playQueue)

  return (
    <>
      <PageHeading title="Favorites">
        {tracks && tracks.length > 0 && (
          <button
            type="button"
            onClick={() => playQueue(tracks, 0)}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
          >
            <PlayIcon width="14" height="14" />
            Play all
          </button>
        )}
      </PageHeading>

      {tracks === undefined && <Spinner />}
      {tracks && tracks.length > 0 && (
        <TrackList tracks={tracks} onPlay={(i) => playQueue(tracks, i)} />
      )}
      {tracks && tracks.length === 0 && (
        <EmptyState title="No favorites yet">
          Tap the heart on any track to save it here.
        </EmptyState>
      )}
    </>
  )
}
