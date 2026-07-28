import { useState } from 'react'
import { Link } from 'react-router'
import ComposerAvatar from '../components/classical/ComposerAvatar'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { composerLifespan, periods, type Period } from '../lib/composers'

export default function Composers() {
  const { data: index, error, loading } = useClassicalIndex()
  const [period, setPeriod] = useState<Period | 'all'>('all')

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!index) return <EmptyState title="Catalog unavailable" />

  const visible = index.composers.filter(
    (c) => period === 'all' || c.composer?.period === period,
  )
  const activePeriods = periods.filter((p) =>
    index.composers.some((c) => c.composer?.period === p.name),
  )

  return (
    <>
      <PageHeading title="Composers" />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPeriod('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            period === 'all'
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          All
        </button>
        {activePeriods.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setPeriod(p.name)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              period === p.name
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((entry) => (
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
                {entry.composer?.surname ?? entry.name}
              </span>
              <span className="block truncate text-[11px] text-zinc-500">
                {entry.composer ? composerLifespan(entry.composer) : ''} ·{' '}
                {entry.works.length} works
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
