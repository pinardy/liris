import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router'
import AboutBlurb from '../components/common/AboutBlurb'
import Button from '../components/common/Button'
import { chipClass } from '../components/common/Chip'
import DetailHeader from '../components/common/DetailHeader'
import { PlayIcon } from '../components/common/icons'
import StartRadioButton from '../components/common/StartRadioButton'
import { AsyncGate, EmptyState } from '../components/common/Status'
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

  if (loading || error) return <AsyncGate loading={loading} error={error} />
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
      <DetailHeader
        artwork={
          <ComposerAvatar
            slug={entry.slug}
            name={entry.composer?.surname ?? entry.name}
            className="size-40 sm:size-48"
            width={500}
          />
        }
        eyebrow={
          <>
            Composer
            {entry.composer && ` · ${entry.composer.period}`}
          </>
        }
        title={entry.name}
        titleClassName="md:text-5xl"
      >
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
            <Button
              onClick={() => playQueue(allTracks, 0)}
              disabled={allTracks.length === 0}
            >
              <PlayIcon width="16" height="16" />
              Play all
            </Button>
            <StartRadioButton groups={entry.works.map(workTracks)} />
          </div>
      </DetailHeader>

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
            className={chipClass}
          >
            More {entry.composer.period} works →
          </Link>
          <a
            href={imslpSearchUrl(entry.composer.name)}
            target="_blank"
            rel="noreferrer"
            title="Public-domain sheet music on IMSLP"
            className={chipClass}
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
