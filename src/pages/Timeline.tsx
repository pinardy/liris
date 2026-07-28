import { Link } from 'react-router'
import ComposerAvatar from '../components/classical/ComposerAvatar'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { periods, type Period } from '../lib/composers'

const PX_PER_YEAR = 3
const GRID_STEP_YEARS = 50

/** One color per period, used for both the bars and the legend. */
const PERIOD_COLORS: Record<Period, string> = {
  Renaissance: 'bg-amber-500',
  Baroque: 'bg-emerald-500',
  Classical: 'bg-sky-500',
  Romantic: 'bg-rose-500',
  Modern: 'bg-violet-500',
}

/**
 * Every composer in the catalog as a lifespan bar on a shared time axis —
 * who overlapped whom, and how the periods hand over. Scrolls horizontally
 * on narrow screens; each row links to the composer's page.
 */
export default function Timeline() {
  const { data: index, error, loading } = useClassicalIndex()

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!index) return <EmptyState title="Catalog unavailable" />

  // Already sorted by birth year in the index.
  const entries = index.composers.filter((e) => e.composer?.born)
  if (entries.length === 0) return <EmptyState title="No dated composers yet" />

  const lifespans = entries.map((e) => ({
    entry: e,
    composer: e.composer!,
    born: e.composer!.born!,
    died: e.composer!.died ?? e.composer!.born! + 80,
  }))

  const minYear =
    Math.floor((Math.min(...lifespans.map((l) => l.born)) - 15) / GRID_STEP_YEARS) *
    GRID_STEP_YEARS
  const maxYear =
    Math.ceil((Math.max(...lifespans.map((l) => l.died)) + 15) / GRID_STEP_YEARS) *
    GRID_STEP_YEARS
  const chartWidth = (maxYear - minYear) * PX_PER_YEAR
  const x = (year: number) => (year - minYear) * PX_PER_YEAR

  const gridYears: number[] = []
  for (let y = minYear; y <= maxYear; y += GRID_STEP_YEARS) gridYears.push(y)

  const activePeriods = periods.filter((p) =>
    lifespans.some((l) => l.composer.period === p.name),
  )

  return (
    <>
      <PageHeading title="Timeline" />
      <p className="-mt-4 mb-4 max-w-2xl text-sm text-zinc-400">
        Every composer in the catalog, by lifespan. Tap a bar to open their works.
      </p>

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1">
        {activePeriods.map((p) => (
          <Link
            key={p.slug}
            to={`/period/${p.slug}`}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
          >
            <span className={`size-2.5 rounded-full ${PERIOD_COLORS[p.name]}`} />
            {p.name}
            <span className="text-zinc-500">{p.range}</span>
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="relative" style={{ width: chartWidth }}>
          {/* Year gridlines behind everything */}
          {gridYears.map((y) => (
            <div
              key={y}
              aria-hidden="true"
              className="absolute inset-y-0 w-px bg-zinc-800/80"
              style={{ left: x(y) }}
            />
          ))}

          {/* Year labels */}
          <div className="relative h-6">
            {gridYears.map((y) => (
              <span
                key={y}
                className="absolute top-0 text-[10px] tabular-nums text-zinc-500"
                style={{ left: x(y) + 4 }}
              >
                {y}
              </span>
            ))}
          </div>

          {lifespans.map(({ entry, composer, born, died }) => (
            <Link
              key={entry.slug}
              to={`/composer/${entry.slug}`}
              className="group relative block h-9"
              title={`${composer.name} (${born}–${died})`}
            >
              <span
                className={`absolute inset-y-1.5 rounded-full opacity-70 transition-opacity group-hover:opacity-100 ${
                  PERIOD_COLORS[composer.period]
                }`}
                style={{ left: x(born), width: Math.max((died - born) * PX_PER_YEAR, 8) }}
              />
              <span
                className="absolute inset-y-0 flex items-center gap-1.5 pl-0.5"
                style={{ left: x(born) }}
              >
                <ComposerAvatar
                  slug={entry.slug}
                  name={composer.surname}
                  className="size-6"
                  width={48}
                />
                <span className="whitespace-nowrap text-xs font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">
                  {composer.surname}
                  <span className="ml-1.5 font-normal tabular-nums text-zinc-300">
                    {born}–{composer.died ?? ''}
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
