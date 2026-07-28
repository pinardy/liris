import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router'
import { Link } from 'react-router'
import AboutBlurb from '../components/common/AboutBlurb'
import { PlayIcon } from '../components/common/icons'
import StartRadioButton from '../components/common/StartRadioButton'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import ComposerAvatar from '../components/classical/ComposerAvatar'
import WorkRow from '../components/classical/WorkRow'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { formBySlug, workTracks } from '../lib/classical'
import { composerLifespan } from '../lib/composers'
import { imslpSearchUrl } from '../lib/imslp'
import { usePlayerStore } from '../player/playerStore'
import { getComposerPlayCount } from '../services/db/stats'
import { fetchSummary } from '../services/wikipedia'

export default function ComposerPage() {
  const { slug } = useParams()
  const { data: index, error, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)
  const playCount = useLiveQuery(
    () => (slug ? getComposerPlayCount(slug) : Promise.resolve(0)),
    [slug],
  )

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  const entry = index?.composers.find((c) => c.slug === slug)
  if (!entry) return <EmptyState title="Composer not found" />

  // Group the composer's works by form so a big catalog stays navigable.
  const byForm = new Map<string, typeof entry.works>()
  for (const work of entry.works) {
    const key = work.formSlug ?? 'other'
    const list = byForm.get(key) ?? []
    list.push(work)
    byForm.set(key, list)
  }
  const groups = [...byForm.entries()].sort((a, b) => b[1].length - a[1].length)
  const allTracks = entry.works.flatMap(workTracks)

  return (
    <>
      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
        <ComposerAvatar
          slug={entry.slug}
          name={entry.composer?.surname ?? entry.name}
          className="size-40 sm:size-48"
          width={500}
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Composer
            {entry.composer && ` · ${entry.composer.period}`}
          </p>
          <h1 className="mt-1 break-words text-3xl font-extrabold md:text-5xl">
            {entry.name}
          </h1>
          {entry.composer && (
            <p className="mt-2 text-sm text-zinc-400">
              {composerLifespan(entry.composer)}
              {entry.composer.nationality && ` · ${entry.composer.nationality}`}
            </p>
          )}
          <p className="mt-1 text-sm text-zinc-400">
            {entry.works.length} works · {entry.trackCount} movements
            {playCount !== undefined && playCount > 0 && (
              <>
                {' · '}
                <Link to="/stats" className="hover:underline" title="Your listening stats">
                  played {playCount} {playCount === 1 ? 'time' : 'times'} by you
                </Link>
              </>
            )}
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
      </div>

      {entry.composer && (
        <AboutBlurb
          cacheKey={`wiki:composer:${entry.slug}`}
          load={() => fetchSummary(entry.composer!.name)}
        />
      )}

      {entry.composer && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            to={`/period/${entry.composer.period.toLowerCase()}`}
            className="rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            More {entry.composer.period} works →
          </Link>
          <a
            href={imslpSearchUrl(entry.composer.name)}
            target="_blank"
            rel="noreferrer"
            title="Public-domain sheet music on IMSLP"
            className="rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Scores on IMSLP ↗
          </a>
        </div>
      )}

      {groups.map(([formSlug, works]) => (
        <section key={formSlug} className="mb-8">
          <h2 className="mb-2 text-lg font-bold">
            {formSlug === 'other'
              ? 'Other works'
              : (formBySlug(formSlug)?.label ?? formSlug)}
          </h2>
          <div className="flex flex-col">
            {works.map((work) => (
              <WorkRow key={work.id} work={work} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
