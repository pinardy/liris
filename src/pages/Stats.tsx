import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import ComposerAvatar from '../components/classical/ComposerAvatar'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, Spinner } from '../components/common/Status'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { periodColors } from '../lib/composers'
import { getListeningStats } from '../services/db/stats'

function formatHours(sec: number): string {
  const h = sec / 3600
  if (h >= 10) return `${Math.round(h)} h`
  if (h >= 1) return `${h.toFixed(1)} h`
  return `${Math.max(1, Math.round(sec / 60))} min`
}

function Tile({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-zinc-900/70 p-4" title={hint}>
      <p className="text-2xl font-extrabold tabular-nums md:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{label}</p>
    </div>
  )
}

/** Your listening, aggregated from the local play history — never leaves the device. */
export default function Stats() {
  const stats = useLiveQuery(getListeningStats, [])
  const { data: index } = useClassicalIndex()

  if (!stats) return <Spinner />
  if (stats.totalPlays === 0) {
    return (
      <>
        <PageHeading title="Your listening" />
        <EmptyState title="Nothing to count yet">
          Play a few movements and this page starts keeping score: top composers,
          favorite periods, streaks.
        </EmptyState>
      </>
    )
  }

  // Map play-history works back onto catalog works, for linking.
  const workIdByKey = new Map<string, string>()
  for (const w of index?.works ?? []) {
    workIdByKey.set(`${w.composerName}::${w.title}`, w.id)
  }

  const maxComposerPlays = stats.topComposers[0]?.plays ?? 1
  const since =
    stats.firstPlayAt !== null
      ? new Date(stats.firstPlayAt).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null

  return (
    <>
      <PageHeading title="Your listening" />
      <p className="-mt-4 mb-6 text-sm text-zinc-400">
        Counted on this device only{since && <> · since {since}</>}.
      </p>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile value={String(stats.totalPlays)} label="movements played" />
        <Tile
          value={formatHours(stats.totalSec)}
          label="of music"
          hint="Estimated from the length of each movement you started"
        />
        <Tile value={String(stats.distinctWorks)} label="different works" />
        <Tile
          value={String(stats.dayStreak)}
          label="day streak"
          hint={`${stats.daysActive} listening days in total`}
        />
      </div>

      <section className="mb-10 max-w-2xl">
        <h2 className="mb-3 text-lg font-bold">Periods</h2>
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
          {stats.byPeriod.map((p) => (
            <div
              key={p.period}
              className={`h-full ${
                p.period === 'Other' ? 'bg-zinc-600' : periodColors[p.period]
              }`}
              style={{ width: `${(p.plays / stats.totalPlays) * 100}%` }}
              title={`${p.period}: ${p.plays} plays`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {stats.byPeriod.map((p) => (
            <span key={p.period} className="flex items-center gap-1.5 text-xs text-zinc-300">
              <span
                className={`size-2.5 rounded-full ${
                  p.period === 'Other' ? 'bg-zinc-600' : periodColors[p.period]
                }`}
              />
              {p.period}
              <span className="tabular-nums text-zinc-500">
                {Math.round((p.plays / stats.totalPlays) * 100)}%
              </span>
            </span>
          ))}
        </div>
      </section>

      <section className="mb-10 max-w-2xl">
        <h2 className="mb-3 text-lg font-bold">Top composers</h2>
        <div className="flex flex-col gap-2">
          {stats.topComposers.map((c) => {
            const inner = (
              <>
                <ComposerAvatar
                  slug={c.slug ?? ''}
                  name={c.name}
                  className="size-9"
                  width={72}
                />
                <span className="w-36 truncate text-sm font-medium sm:w-44">{c.name}</span>
                <span className="h-2 min-w-0 flex-1 rounded-full bg-zinc-800">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(c.plays / maxComposerPlays) * 100}%` }}
                  />
                </span>
                <span className="w-10 text-right text-xs tabular-nums text-zinc-400">
                  {c.plays}
                </span>
              </>
            )
            const className = 'flex items-center gap-3'
            return c.slug ? (
              <Link
                key={c.name}
                to={`/composer/${c.slug}`}
                className={`${className} rounded-md py-0.5 hover:bg-zinc-900`}
              >
                {inner}
              </Link>
            ) : (
              <span key={c.name} className={className}>
                {inner}
              </span>
            )
          })}
        </div>
      </section>

      <section className="mb-10 max-w-2xl">
        <h2 className="mb-3 text-lg font-bold">Most played works</h2>
        <ol className="flex flex-col">
          {stats.topWorks.map((w, i) => {
            const workId = workIdByKey.get(`${w.composer}::${w.title}`)
            return (
              <li
                key={`${w.composer}::${w.title}`}
                className="flex items-baseline gap-3 border-b border-zinc-900 py-2 last:border-0"
              >
                <span className="w-5 shrink-0 text-right text-sm tabular-nums text-zinc-500">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  {workId ? (
                    <Link
                      to={`/work/${workId}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {w.title}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-medium">{w.title}</span>
                  )}
                  <span className="block truncate text-xs text-zinc-500">{w.composer}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                  {w.plays} {w.plays === 1 ? 'play' : 'plays'}
                </span>
              </li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
