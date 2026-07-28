import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, Spinner } from '../components/common/Status'
import { PlayIcon } from '../components/common/icons'
import { findComposer } from '../lib/composers'
import { slugify } from '../lib/classical'
import { formatDuration } from '../lib/format'
import { usePlayerStore } from '../player/playerStore'
import { getPlayHistory, type HistoryEntry } from '../services/db/recents'

/** Mirror of the catalog id scheme, from a play's denormalized fields. */
function workIdFor(entry: HistoryEntry): string {
  const composer = findComposer(entry.play.composer)
  return `${composer?.slug ?? slugify(entry.play.composer)}--${slugify(entry.play.work)}`
}

function dayLabel(ts: number): string {
  const day = new Date(ts)
  day.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return day.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(day.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  })
}

export default function History() {
  const entries = useLiveQuery(() => getPlayHistory(500), [])
  const playTrack = usePlayerStore((s) => s.playTrack)

  if (entries === undefined) return <Spinner />

  // Group consecutive plays by local calendar day, newest day first.
  const days: { label: string; entries: HistoryEntry[] }[] = []
  for (const entry of entries) {
    const label = dayLabel(entry.play.playedAt)
    const last = days[days.length - 1]
    if (last && last.label === label) last.entries.push(entry)
    else days.push({ label, entries: [entry] })
  }

  return (
    <>
      <PageHeading title="History">
        <Link to="/stats" className="text-sm text-zinc-400 hover:text-white">
          Your stats →
        </Link>
      </PageHeading>

      {entries.length === 0 && (
        <EmptyState title="Nothing played yet">
          Every movement you play is remembered here.
        </EmptyState>
      )}

      {days.map((day) => (
        <section key={day.label} className="mb-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {day.label}
            <span className="ml-2 font-normal normal-case text-zinc-500">
              {day.entries.length} {day.entries.length === 1 ? 'play' : 'plays'}
            </span>
          </h2>
          <div className="flex flex-col">
            {day.entries.map((entry) => (
              <div
                key={entry.play.id}
                className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-800/70"
              >
                <span className="w-14 shrink-0 text-xs tabular-nums text-zinc-500">
                  {new Date(entry.play.playedAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => entry.track && playTrack(entry.track)}
                  disabled={!entry.track}
                  aria-label={`Play ${entry.track?.title ?? entry.play.work}`}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors enabled:group-hover:bg-accent enabled:group-hover:text-black disabled:opacity-40"
                >
                  <PlayIcon width="12" height="12" className="translate-x-px" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">
                    {entry.track?.title ?? entry.play.work}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    <Link
                      to={`/work/${workIdFor(entry)}`}
                      className="hover:text-white hover:underline"
                    >
                      {entry.play.work}
                    </Link>
                    {' · '}
                    {entry.play.composer}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                  {formatDuration(entry.play.durationSec)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {entries.length === 500 && (
        <p className="pb-4 text-xs text-zinc-600">Showing the last 500 plays.</p>
      )}
    </>
  )
}
