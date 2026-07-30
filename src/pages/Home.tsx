import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import ArtworkImage from '../components/common/ArtworkImage'
import ChipSection from '../components/common/Chip'
import PlayButton from '../components/common/PlayButton'
import { ErrorMessage, Spinner } from '../components/common/Status'
import { PlayIcon } from '../components/common/icons'
import ComposerAvatar from '../components/classical/ComposerAvatar'
import WorkCard from '../components/classical/WorkCard'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { forms, workTracks } from '../lib/classical'
import { composerLifespan, periods } from '../lib/composers'
import { dailyMixWorks } from '../lib/dailyMix'
import { instruments, roleLabels } from '../lib/performers'
import { usePlayerStore } from '../player/playerStore'
import { getRecentTracks } from '../services/db/recents'
import { getListeningStats } from '../services/db/stats'
import {
  archiveThumbnail,
  classicalCollections,
} from '../services/archive/api'
import { getRadios, getRadioTrack, type RadioStation } from '../services/jamendo/api'

export default function Home() {
  const { data: index, error, loading } = useClassicalIndex()
  const recentTracks = useLiveQuery(() => getRecentTracks(6), [])
  const radiosState = useAsync(() => getRadios(12), [], true, 'home:radios')
  const statsState = useAsync(getListeningStats, [], true, 'home:stats')
  const playQueue = usePlayerStore((s) => s.playQueue)
  const playTrack = usePlayerStore((s) => s.playTrack)
  const startRadio = usePlayerStore((s) => s.startRadio)

  const mixWorks =
    index && statsState.data ? dailyMixWorks(index, statsState.data) : []

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
  const availableInstruments = index
    ? instruments.filter((i) => (index.byInstrument.get(i.slug)?.length ?? 0) > 0)
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

      {index && index.failedCollections.length > 0 && (
        <p className="mb-6 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-200/90">
          Couldn't load {index.failedCollections.join(', ')} — some works may be
          missing until the next refresh.
        </p>
      )}

      {mixWorks.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-900 p-5 md:p-6">
            <div>
              <h2 className="text-base font-bold md:text-lg">Your Daily Mix</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {mixWorks.length} works around{' '}
                {[...new Set(mixWorks.map((w) => w.composerName))].slice(0, 3).join(', ')}
                {' '}— rebuilt every day from your listening.
              </p>
            </div>
            <PlayButton
              onClick={() => startRadio(mixWorks.map(workTracks))}
              aria-label="Play your daily mix"
            />
          </div>
        </section>
      )}

      {recentTracks && recentTracks.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Continue listening</h2>
            <span className="flex gap-3 text-xs">
              <Link to="/history" className="text-zinc-400 hover:text-white">
                History →
              </Link>
              <Link to="/stats" className="text-zinc-400 hover:text-white">
                Your stats →
              </Link>
            </span>
          </div>
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
                  <ComposerAvatar
                    slug={entry.slug}
                    name={entry.composer?.surname ?? entry.name}
                    className="aspect-square w-full transition-transform group-hover:scale-105"
                    width={240}
                  />
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

          <ChipSection
            title="Forms"
            items={availableForms.map((f) => ({
              key: f.slug,
              to: `/form/${f.slug}`,
              label: (
                <>
                  {f.label}
                  <span className="ml-1.5 text-xs text-zinc-500">
                    {index.byForm.get(f.slug)?.length}
                  </span>
                </>
              ),
            }))}
          />

          <ChipSection
            title="Instruments"
            items={availableInstruments.map((i) => ({
              key: i.slug,
              to: `/instrument/${i.slug}`,
              label: (
                <>
                  {i.label}
                  <span className="ml-1.5 text-xs text-zinc-500">
                    {index.byInstrument.get(i.slug)?.length}
                  </span>
                </>
              ),
            }))}
          />

          <section className="mb-10">
            <Link
              to="/quiz"
              className="group flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-violet-950 via-zinc-900 to-zinc-900 p-5 transition-colors hover:from-violet-900 md:p-6"
            >
              <span>
                <span className="block text-base font-bold md:text-lg">
                  Guess the composer
                </span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Ten blind clips from the catalog. How good is your ear?
                </span>
              </span>
              <PlayButton decorative />
            </Link>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold">Essential works</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {index.works.slice(0, 12).map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </section>

          <ChipSection
            title="Performers"
            items={index.performers.map((p) => ({
              key: p.slug,
              to: `/performer/${p.slug}`,
              title: roleLabels[p.role],
              label: (
                <>
                  {p.name}
                  <span className="ml-1.5 text-xs text-zinc-500">
                    {p.role !== 'artist' && `${roleLabels[p.role]} · `}
                    {p.works.length}
                  </span>
                </>
              ),
            }))}
          />
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
