import { useParams } from 'react-router'
import { PlayIcon } from '../components/common/icons'
import StartRadioButton from '../components/common/StartRadioButton'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import WorkRow from '../components/classical/WorkRow'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { formBySlug, workTracks, type Work } from '../lib/classical'
import { periods } from '../lib/composers'
import { usePlayerStore } from '../player/playerStore'

type Mode = 'period' | 'form' | 'performer'

/** Shared list page for the three secondary browse dimensions. */
export default function BrowsePage({ mode }: { mode: Mode }) {
  const { slug } = useParams()
  const { data: index, error, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!index || !slug) return <EmptyState title="Catalog unavailable" />

  let title = ''
  let subtitle = ''
  let works: Work[] = []

  if (mode === 'period') {
    const period = periods.find((p) => p.slug === slug)
    if (!period) return <EmptyState title="Period not found" />
    title = period.name
    subtitle = `${period.range} — ${period.blurb}`
    works = index.byPeriod.get(period.name) ?? []
  } else if (mode === 'form') {
    const form = formBySlug(slug)
    if (!form) return <EmptyState title="Form not found" />
    title = form.label
    subtitle = form.blurb
    works = index.byForm.get(form.slug) ?? []
  } else {
    const performer = index.performers.find((p) => p.slug === slug)
    if (!performer) return <EmptyState title="Performer not found" />
    title = performer.name
    subtitle = 'Performer'
    works = performer.works
  }

  const allTracks = works.flatMap(workTracks)

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {mode === 'period' ? 'Period' : mode === 'form' ? 'Form' : 'Performer'}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p>
        <p className="mt-1 text-sm text-zinc-400">
          {works.length} {works.length === 1 ? 'work' : 'works'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => playQueue(allTracks, 0)}
            disabled={allTracks.length === 0}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <PlayIcon width="16" height="16" />
            Play all
          </button>
          <StartRadioButton tracks={allTracks} />
        </div>
      </div>

      {works.length > 0 ? (
        <div className="flex flex-col">
          {works.map((work) => (
            <WorkRow key={work.id} work={work} showComposer />
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing here yet" />
      )}
    </>
  )
}
