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
import { formBySlug, forms, workDuration } from '../lib/classical'
import { composerLifespan, fold, periods } from '../lib/composers'
import { detectInstruments, instruments } from '../lib/performers'
import { usePlayerStore } from '../player/playerStore'
import { db } from '../services/db/db'
import { plural } from '../lib/format'

const MAX_LENGTH_OPTIONS = [10, 20, 40] as const
/** Results beyond this are cut — always disclosed, never silently. */
const WORK_LIMIT = 60

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const periodSlug = params.get('period') ?? ''
  const formSlug = params.get('form') ?? ''
  const instrumentSlug = params.get('instrument') ?? ''
  const performerSlug = params.get('performer') ?? ''
  const maxMin = Number(params.get('max')) || 0

  // Folded so 'Dvorak' finds Dvořák, 'Faure' finds Fauré — and vice versa.
  const debounced = useDebouncedValue(fold(query.trim()), 250)
  const anyFacet = Boolean(periodSlug || formSlug || instrumentSlug || performerSlug || maxMin)
  // Facets alone are a valid search: 'all Baroque concertos' needs no text.
  const enabled = debounced.length > 0 || anyFacet

  const { data: index, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // Local collection: imported files, downloads and playlisted snapshots.
  // Facets describe catalog works, not raw tracks, so they can't filter these
  // — but silently dropping your own files from the results was worse. They
  // stay, under a heading that says the filters don't apply to them.
  const showCollection = debounced.length > 0
  const collectionTracks = useLiveQuery(async () => {
    if (!showCollection) return []
    const all = await db.tracks.toArray()
    return all
      .filter(
        (t) =>
          fold(t.title).includes(debounced) ||
          fold(t.artist).includes(debounced) ||
          fold(t.album ?? '').includes(debounced),
      )
      .slice(0, 12)
  }, [debounced, showCollection])

  const periodName = periods.find((p) => p.slug === periodSlug)?.name

  const composers =
    enabled && debounced.length > 0 && !formSlug && !instrumentSlug && !performerSlug && !maxMin
      ? (index?.composers ?? []).filter(
          (c) =>
            fold(c.name).includes(debounced) &&
            (!periodName || c.composer?.period === periodName),
        )
      : []

  const baseWorks = performerSlug
    ? (index?.performers.find((p) => p.slug === performerSlug)?.works ?? [])
    : (index?.works ?? [])

  const matchingWorks = enabled
    ? baseWorks
        .filter(
          (w) =>
            (debounced.length === 0 ||
              fold(w.title).includes(debounced) ||
              fold(w.composerName).includes(debounced) ||
              fold(w.catalogue ?? '').includes(debounced)) &&
            (!periodName || w.period === periodName) &&
            (!formSlug || w.formSlug === formSlug) &&
            (!instrumentSlug || detectInstruments(w.title).includes(instrumentSlug)) &&
            (!maxMin || workDuration(w) <= maxMin * 60),
        )
    : []
  const works = matchingWorks.slice(0, WORK_LIMIT)
  const truncated = matchingWorks.length > WORK_LIMIT

  const nothing =
    enabled &&
    !loading &&
    composers.length === 0 &&
    works.length === 0 &&
    (collectionTracks?.length ?? 0) === 0

  const selectClass =
    'rounded-full bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/30'
  const activeSelectClass =
    'rounded-full bg-accent/20 px-3 py-1.5 text-xs text-accent ring-1 ring-accent/50 focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <>
      <PageHeading title="Search" />

      <div className="relative mb-3 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Composers, works, opus numbers…"
          autoFocus
          className="w-full rounded-full bg-zinc-800 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          value={periodSlug}
          onChange={(e) => setParam('period', e.target.value)}
          aria-label="Filter by period"
          className={periodSlug ? activeSelectClass : selectClass}
        >
          <option value="">Any period</option>
          {periods.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={formSlug}
          onChange={(e) => setParam('form', e.target.value)}
          aria-label="Filter by form"
          className={formSlug ? activeSelectClass : selectClass}
        >
          <option value="">Any form</option>
          {forms.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={instrumentSlug}
          onChange={(e) => setParam('instrument', e.target.value)}
          aria-label="Filter by instrument"
          className={instrumentSlug ? activeSelectClass : selectClass}
        >
          <option value="">Any instrument</option>
          {instruments.map((i) => (
            <option key={i.slug} value={i.slug}>
              {i.label}
            </option>
          ))}
        </select>
        <select
          value={performerSlug}
          onChange={(e) => setParam('performer', e.target.value)}
          aria-label="Filter by performer"
          className={performerSlug ? activeSelectClass : selectClass}
        >
          <option value="">Any performer</option>
          {(index?.performers ?? []).slice(0, 25).map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={maxMin || ''}
          onChange={(e) => setParam('max', e.target.value)}
          aria-label="Filter by length"
          className={maxMin ? activeSelectClass : selectClass}
        >
          <option value="">Any length</option>
          {MAX_LENGTH_OPTIONS.map((min) => (
            <option key={min} value={min}>
              Under {min} min
            </option>
          ))}
        </select>
        {anyFacet && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams()
              if (query) next.set('q', query)
              setParams(next, { replace: true })
            }}
            className="text-xs text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {!enabled && (
        <EmptyState title="Search the catalog">
          Try a composer (“Chopin”), a work (“Eroica”), or a catalogue number
          (“BWV 988”) — or filter alone: every Baroque concerto is one click away.
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
                  <span className="block text-[11px] text-zinc-400">
                    {entry.composer ? `${composerLifespan(entry.composer)} · ` : ''}
                    {plural(entry.works.length, 'work')}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {works.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-bold">
            Works
            <span className="ml-2 text-sm font-normal text-zinc-400">
              {truncated
                ? `first ${WORK_LIMIT} of ${matchingWorks.length}`
                : matchingWorks.length}{' '}
              matching
              {formSlug && ` · ${formBySlug(formSlug)?.label ?? formSlug}`}
            </span>
          </h2>
          <div className="flex flex-col">
            {works.map((work) => (
              <WorkRow key={work.id} work={work} showComposer />
            ))}
          </div>
          {truncated && (
            <p className="mt-3 text-xs text-zinc-400">
              {matchingWorks.length - WORK_LIMIT} more match. Narrow the search
              with a filter above to see them.
            </p>
          )}
        </section>
      )}

      {collectionTracks && collectionTracks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-bold">
            From your collection
            {anyFacet && (
              <span className="ml-2 text-sm font-normal text-zinc-400">
                filters above don't apply here
              </span>
            )}
          </h2>
          <TrackList
            tracks={collectionTracks}
            onPlay={(i) => playQueue(collectionTracks, i)}
          />
        </section>
      )}

      {nothing && (
        <EmptyState
          title={
            debounced.length > 0
              ? `Nothing found for “${query.trim()}”`
              : 'Nothing matches these filters'
          }
          action={{ label: 'Browse composers', to: '/composers' }}
        >
          {debounced.length > 0
            ? 'Try a different spelling, loosen a filter, or browse by composer instead.'
            : 'Try loosening a filter.'}
        </EmptyState>
      )}
    </>
  )
}
