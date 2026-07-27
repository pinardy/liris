import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import ArtworkImage from '../components/common/ArtworkImage'
import { ErrorMessage, Spinner } from '../components/common/Status'
import { PlayIcon } from '../components/common/icons'
import WorkCard from '../components/classical/WorkCard'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { forms } from '../lib/classical'
import { composerLifespan, periods } from '../lib/composers'
import { usePlayerStore } from '../player/playerStore'
import { getRecentTracks } from '../services/db/recents'
import {
  archiveThumbnail,
  classicalCollections,
} from '../services/archive/api'
import { getRadios, getRadioTrack, type RadioStation } from '../services/jamendo/api'

export default function Home() {
  const { data: index, error, loading } = useClassicalIndex()
  const recentTracks = useLiveQuery(() => getRecentTracks(6), [])
  const radiosState = useAsync(() => getRadios(12), [], true, 'home:radios')
  const playQueue = usePlayerStore((s) => s.playQueue)
  const playTrack = usePlayerStore((s) => s.playTrack)

  async function playRadio(station: RadioStation) {
    try {
      playTrack(await getRadioTrack(station))
    } catch (err) {
      console.error('Could not start radio', err)
    }
  }

  const featuredComposers = index
    ? [...index.composers].sort((a, b) => b.works.length - a.works.length).slice(0, 10)
    : []
  const availableForms = index
    ? forms.filter((f) => (index.byForm.get(f.slug)?.length ?? 0) > 0)
    : []

  return (
    <>
      <section className="mb-10 rounded-2xl bg-gradient-to-br from-indigo-900 via-zinc-900 to-zinc-950 p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Liris Classical
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
          The classical canon, free and in full.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-zinc-300 md:text-base">
          Browse by composer, period and form. Every recording here is public domain
          or Creative Commons — yours to stream, download and keep offline.
        </p>
        {index && (
          <p className="mt-4 text-xs text-zinc-400">
            {index.works.length} works · {index.trackCount} movements ·{' '}
            {index.composers.length} composers
          </p>
        )}
      </section>

      {loading && <Spinner />}
      {error && <ErrorMessage error={error} />}

      {recentTracks && recentTracks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Continue listening</h2>
          <TrackList tracks={recentTracks} onPlay={(i) => playQueue(recentTracks, i)} />
        </section>
      )}

      {index && (
        <>
          <section className="mb-10">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">Composers</h2>
              <Link to="/composers" className="text-xs text-zinc-400 hover:text-white">
                See all {index.composers.length} →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {featuredComposers.map((entry) => (
                <Link
                  key={entry.slug}
                  to={`/composer/${entry.slug}`}
                  className="group w-28 shrink-0 text-center"
                >
                  <span className="flex aspect-square w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-800 to-zinc-800 text-2xl font-bold text-indigo-200 transition-transform group-hover:scale-105">
                    {(entry.composer?.surname ?? entry.name).slice(0, 2)}
                  </span>
                  <span className="mt-2 block truncate text-sm font-semibold">
                    {entry.composer?.surname ?? entry.name}
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    {entry.works.length} works
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold">Periods</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {periods
                .filter((p) => (index.byPeriod.get(p.name)?.length ?? 0) > 0)
                .map((p) => (
                  <Link
                    key={p.slug}
                    to={`/period/${p.slug}`}
                    className="rounded-lg bg-zinc-900/60 p-4 transition-colors hover:bg-zinc-800"
                  >
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-zinc-400">{p.range}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {index.byPeriod.get(p.name)?.length} works
                    </p>
                  </Link>
                ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold">Forms</h2>
            <div className="flex flex-wrap gap-2">
              {availableForms.map((f) => (
                <Link
                  key={f.slug}
                  to={`/form/${f.slug}`}
                  className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                >
                  {f.label}
                  <span className="ml-1.5 text-xs text-zinc-500">
                    {index.byForm.get(f.slug)?.length}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold">Essential works</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {index.works.slice(0, 12).map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </section>

          {index.performers.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 text-lg font-bold">Performers</h2>
              <div className="flex flex-wrap gap-2">
                {index.performers.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/performer/${p.slug}`}
                    className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                  >
                    {p.name}
                    <span className="ml-1.5 text-xs text-zinc-500">{p.works.length}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-bold">Collections</h2>
        <p className="mb-3 text-sm text-zinc-400">
          The editions this catalog is built from.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {classicalCollections.map((c) => (
            <Link
              key={c.itemId}
              to={`/collection/${c.itemId}`}
              className="group flex flex-col gap-2 rounded-lg bg-zinc-900/60 p-3 transition-colors hover:bg-zinc-800"
            >
              <ArtworkImage
                src={archiveThumbnail(c.itemId)}
                className="aspect-square w-full"
                rounded="rounded-md"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="block truncate text-xs text-zinc-400">{c.artist}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {radiosState.data && radiosState.data.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-bold">Radio</h2>
          <p className="mb-3 text-sm text-zinc-400">
            Live Creative Commons stations, including a classical stream.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {radiosState.data.map((station) => (
              <button
                key={station.name}
                type="button"
                onClick={() => void playRadio(station)}
                className="group w-28 shrink-0 text-left"
              >
                <span className="relative block">
                  <ArtworkImage
                    src={station.imageUrl}
                    className="aspect-square w-full"
                    rounded="rounded-lg"
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayIcon width="28" height="28" className="text-white" />
                  </span>
                </span>
                <span className="mt-1.5 block truncate text-xs font-medium">
                  {station.dispName}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {index && index.composers.length > 0 && (
        <p className="pb-4 text-xs text-zinc-600">
          Earliest composer:{' '}
          {index.composers[0].composer
            ? `${index.composers[0].name} (${composerLifespan(index.composers[0].composer)})`
            : index.composers[0].name}
        </p>
      )}
    </>
  )
}
