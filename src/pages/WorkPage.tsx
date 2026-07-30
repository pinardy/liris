import { useState } from 'react'
import { Link, useParams } from 'react-router'
import DownloadWorkButton from '../components/classical/DownloadWorkButton'
import FavoriteWorkButton from '../components/classical/FavoriteWorkButton'
import TermChips from '../components/classical/TermChips'
import AboutBlurb from '../components/common/AboutBlurb'
import ArtworkImage from '../components/common/ArtworkImage'
import Button from '../components/common/Button'
import { buttonClass } from '../components/common/buttonStyles'
import DetailHeader from '../components/common/DetailHeader'
import { PlayIcon } from '../components/common/icons'
import { AsyncGate, EmptyState } from '../components/common/Status'
import TrackList from '../components/tracks/TrackList'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { formBySlug } from '../lib/classical'
import { formatDuration } from '../lib/format'
import { composerBySlug } from '../lib/composers'
import { detectInstruments, instrumentBySlug } from '../lib/performers'
import { imslpSearchUrl } from '../lib/imslp'
import { usePlayerStore } from '../player/playerStore'
import { searchSummary } from '../services/wikipedia'

export default function WorkPage() {
  const { id } = useParams()
  const { data: index, error, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)
  const [recordingIdx, setRecordingIdx] = useState(0)

  if (loading || error) return <AsyncGate loading={loading} error={error} />
  const work = id ? index?.workById.get(id) : undefined
  if (!work) return <EmptyState title="Work not found" />

  const recording = work.recordings[Math.min(recordingIdx, work.recordings.length - 1)]
  const form = work.formSlug ? formBySlug(work.formSlug) : undefined
  const workInstruments = detectInstruments(work.title)
    .map(instrumentBySlug)
    .filter((i) => i !== undefined)
  // Search (not exact lookup): article titles rarely match work titles
  // verbatim. The surname check discards confidently-wrong top hits.
  const surname = work.composerSlug
    ? (composerBySlug(work.composerSlug)?.surname ?? work.composerName)
    : work.composerName

  return (
    <>
      <DetailHeader
        artwork={
          <ArtworkImage
            src={recording.artworkUrl}
            className="size-40 sm:size-48"
            rounded="rounded-lg"
          />
        }
        eyebrow={
          <>
            {form?.label.replace(/s$/, '') ?? 'Work'}
            {work.period && ` · ${work.period}`}
          </>
        }
        title={work.title}
      >
          <p className="mt-2 text-sm text-zinc-300">
            {work.composerSlug ? (
              <Link
                to={`/composer/${work.composerSlug}`}
                className="font-semibold text-accent hover:underline"
              >
                {work.composerName}
              </Link>
            ) : (
              <span className="font-semibold">{work.composerName}</span>
            )}
            {work.catalogue && <span className="text-zinc-400"> · {work.catalogue}</span>}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {recording.tracks.length}{' '}
            {recording.tracks.length === 1 ? 'movement' : 'movements'} ·{' '}
            {formatDuration(recording.durationSec)}
            {recording.performers.length > 0 && (
              <> · {recording.performers.join(', ')}</>
            )}
            {workInstruments.map((i) => (
              <span key={i.slug}>
                {' · '}
                <Link to={`/instrument/${i.slug}`} className="hover:text-white hover:underline">
                  {i.label}
                </Link>
              </span>
            ))}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => playQueue(recording.tracks, 0)}>
              <PlayIcon width="16" height="16" />
              Play
            </Button>
            <FavoriteWorkButton tracks={recording.tracks} />
            <DownloadWorkButton tracks={recording.tracks} />
            <a
              href={imslpSearchUrl(`${work.title} ${work.composerName}`)}
              target="_blank"
              rel="noreferrer"
              title="Find the sheet music on IMSLP, the free public-domain score library"
              className={buttonClass('outline')}
            >
              Score on IMSLP ↗
            </a>
          </div>
      </DetailHeader>

      <AboutBlurb
        cacheKey={`wiki:work:${work.id}`}
        load={() => searchSummary(`${work.title} ${surname}`, surname)}
      />

      {work.recordings.length > 1 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {work.recordings.length} recordings
          </h2>
          <div className="flex flex-wrap gap-2">
            {work.recordings.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecordingIdx(i)}
                className={`rounded-lg border px-4 py-2 text-left text-sm transition-colors ${
                  i === recordingIdx
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <span className="block font-medium">
                  {r.performers.join(', ') || r.collectionName}
                </span>
                <span className="block text-xs text-zinc-400">
                  {r.tracks.length} movements · {formatDuration(r.durationSec)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <TrackList
        tracks={recording.tracks}
        onPlay={(i) => playQueue(recording.tracks, i)}
      />

      <TermChips texts={[work.title, ...recording.tracks.map((t) => t.title)]} />

      <p className="mt-6 text-xs text-zinc-600">
        From{' '}
        <Link to={`/collection/${recording.collectionId}`} className="hover:underline">
          {recording.collectionName}
        </Link>{' '}
        · {recording.license}
      </p>
    </>
  )
}
