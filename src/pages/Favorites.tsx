import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, Spinner } from '../components/common/Status'
import { PlayIcon } from '../components/common/icons'
import TrackList from '../components/tracks/TrackList'
import { usePlayerStore } from '../player/playerStore'
import { getFavoriteTracks } from '../services/db/favorites'
import type { Track } from '../types/model'

interface WorkGroup {
  title: string
  artist: string
  tracks: Track[]
}

/**
 * Favorited movements of one work regroup into a work section (a hearted
 * symphony reads as a symphony, not four scattered rows); lone favorites
 * stay in a flat list. Group order follows the newest favorite.
 */
function groupByWork(tracks: Track[]): { works: WorkGroup[]; singles: Track[] } {
  const groups = new Map<string, WorkGroup>()
  for (const track of tracks) {
    const key = `${track.artist}::${track.album ?? ''}`
    const group = groups.get(key) ?? {
      title: track.album ?? '',
      artist: track.artist,
      tracks: [],
    }
    group.tracks.push(track)
    groups.set(key, group)
  }
  const works: WorkGroup[] = []
  const singles: Track[] = []
  for (const group of groups.values()) {
    if (group.title && group.tracks.length > 1) {
      // Favorites arrive newest-first; archive ids embed the (name-sorted)
      // filename, so an id sort restores movement order within the work.
      if (group.tracks.every((t) => t.id.startsWith('arc:'))) {
        group.tracks.sort((a, b) => a.id.localeCompare(b.id))
      }
      works.push(group)
    } else {
      singles.push(...group.tracks)
    }
  }
  return { works, singles }
}

export default function Favorites() {
  const tracks = useLiveQuery(getFavoriteTracks, [])
  const playQueue = usePlayerStore((s) => s.playQueue)

  const grouped = tracks ? groupByWork(tracks) : undefined

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

      {grouped &&
        grouped.works.map((work) => (
          <section key={`${work.artist}::${work.title}`} className="mb-8">
            <div className="mb-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => playQueue(work.tracks, 0)}
                aria-label={`Play ${work.title}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-white transition-colors hover:bg-accent hover:text-black"
              >
                <PlayIcon width="14" height="14" className="translate-x-px" />
              </button>
              <div className="min-w-0">
                <h2 className="truncate font-bold">{work.title}</h2>
                <p className="truncate text-xs text-zinc-400">{work.artist}</p>
              </div>
            </div>
            <TrackList tracks={work.tracks} onPlay={(i) => playQueue(work.tracks, i)} />
          </section>
        ))}

      {grouped && grouped.singles.length > 0 && (
        <section className="mb-8">
          {grouped.works.length > 0 && (
            <h2 className="mb-1 font-bold">Single movements & tracks</h2>
          )}
          <TrackList
            tracks={grouped.singles}
            onPlay={(i) => playQueue(grouped.singles, i)}
          />
        </section>
      )}

      {tracks && tracks.length === 0 && (
        <EmptyState title="No favorites yet">
          Tap the heart on any track — or on a work's page to save all its
          movements at once.
        </EmptyState>
      )}
    </>
  )
}
