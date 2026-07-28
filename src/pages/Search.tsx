import { Link, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, Spinner } from '../components/common/Status'
import { SearchIcon } from '../components/common/icons'
import ComposerAvatar from '../components/classical/ComposerAvatar'
import WorkRow from '../components/classical/WorkRow'
import TrackList from '../components/tracks/TrackList'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { composerLifespan } from '../lib/composers'
import { usePlayerStore } from '../player/playerStore'
import { db } from '../services/db/db'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 250)
  const enabled = debounced.length > 0

  const { data: index, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)

  // Local collection: imported files, downloads and playlisted snapshots.
  const collectionTracks = useLiveQuery(async () => {
    if (!enabled) return []
    const all = await db.tracks.toArray()
    return all
      .filter(
        (t) =>
          t.title.toLowerCase().includes(debounced) ||
          t.artist.toLowerCase().includes(debounced) ||
          (t.album ?? '').toLowerCase().includes(debounced),
      )
      .slice(0, 12)
  }, [debounced, enabled])

  const composers = enabled
    ? (index?.composers ?? []).filter((c) => c.name.toLowerCase().includes(debounced))
    : []
  const works = enabled
    ? (index?.works ?? [])
        .filter(
          (w) =>
            w.title.toLowerCase().includes(debounced) ||
            w.composerName.toLowerCase().includes(debounced) ||
            (w.catalogue ?? '').toLowerCase().includes(debounced),
        )
        .slice(0, 40)
    : []

  const nothing =
    enabled &&
    !loading &&
    composers.length === 0 &&
    works.length === 0 &&
    (collectionTracks?.length ?? 0) === 0

  return (
    <>
      <PageHeading title="Search" />

      <div className="relative mb-6 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            const next = new URLSearchParams(params)
            if (e.target.value) next.set('q', e.target.value)
            else next.delete('q')
            setParams(next, { replace: true })
          }}
          placeholder="Composers, works, opus numbers…"
          autoFocus
          className="w-full rounded-full bg-zinc-800 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      {!enabled && (
        <EmptyState title="Search the catalog">
          Try a composer (“Chopin”), a work (“Eroica”), or a catalogue number
          (“BWV 988”).
        </EmptyState>
      )}

      {enabled && loading && <Spinner />}

      {composers.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-bold">Composers</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {composers.map((entry) => (
              <Link
                key={entry.slug}
                to={`/composer/${entry.slug}`}
                className="flex items-center gap-3 rounded-lg bg-zinc-900/60 p-3 transition-colors hover:bg-zinc-800"
              >
                <ComposerAvatar
                  slug={entry.slug}
                  name={entry.composer?.surname ?? entry.name}
                  className="size-12"
                  width={120}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {entry.name}
                  </span>
                  <span className="block truncate text-[11px] text-zinc-500">
                    {entry.composer ? composerLifespan(entry.composer) : ''} ·{' '}
                    {entry.works.length} works
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {works.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-bold">Works</h2>
          <div className="flex flex-col">
            {works.map((work) => (
              <WorkRow key={work.id} work={work} showComposer />
            ))}
          </div>
        </section>
      )}

      {collectionTracks && collectionTracks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-bold">From your collection</h2>
          <TrackList
            tracks={collectionTracks}
            onPlay={(i) => playQueue(collectionTracks, i)}
          />
        </section>
      )}

      {nothing && (
        <EmptyState title={`Nothing found for “${query.trim()}”`}>
          Try a different spelling, or browse by composer instead.
        </EmptyState>
      )}
    </>
  )
}
