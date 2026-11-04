import { Link, useParams, useSearchParams } from 'react-router'
import DownloadWorkButton from '../components/classical/DownloadWorkButton'
import FavoriteWorkButton from '../components/classical/FavoriteWorkButton'
import TermChips from '../components/classical/TermChips'
import AboutBlurb from '../components/common/AboutBlurb'
import BackLink from '../components/common/BackLink'
import ArtworkImage from '../components/common/ArtworkImage'
import Button from '../components/common/Button'
import { chipClass } from '../components/common/Chip'
import DetailHeader from '../components/common/DetailHeader'
import { PlayIcon } from '../components/common/icons'
import { AsyncGate, EmptyState } from '../components/common/Status'
import TrackList from '../components/tracks/TrackList'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { formBySlug } from '../lib/classical'
import { formatDuration, plural } from '../lib/format'
import { composerBySlug, composerImageUrl } from '../lib/composers'
import { detectInstruments, instrumentBySlug } from '../lib/performers'
import { imslpSearchUrl } from '../lib/imslp'
import { sungTextFor } from '../lib/libretti'
import { usePlayerStore } from '../player/playerStore'
import { searchSummary } from '../services/wikipedia'

export default function WorkPage() {
  const { id } = useParams()
  const { data: index, error, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)
  // The chosen recording is a first-class choice on this page, so it lives in
  // the URL: shareable, and still selected after a back-navigation.
  const [params, setParams] = useSearchParams()
  // Truncated as well as clamped: a fractional index (?rec=1.5) survives
  // Math.min and then indexes the array to undefined.
  const recordingIdx = Math.max(0, Math.trunc(Number(params.get('rec')) || 0))
  function setRecordingIdx(next: number) {
    const p = new URLSearchParams(params)
    if (next === 0) p.delete('rec')
    else p.set('rec', String(next))
    setParams(p, { replace: true })
  }

  if (loading || error) return <AsyncGate loading={loading} error={error} />
  const work = id ? index?.workById.get(id) : undefined
  if (!work) {
    return (
      <EmptyState
        title="Work not found"
        action={{ label: 'Browse composers', to: '/composers' }}
      >
        It may not be part of the catalog this app indexes.
      </EmptyState>
    )
  }

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
  const sungText = sungTextFor(work)
  // The collection thumbnail is one logo shared by every work in that
  // edition; the composer's portrait actually identifies this page.
  const artwork =
    (work.composerSlug && composerImageUrl(work.composerSlug, 400)) || recording.artworkUrl

  return (
    <>
      <BackLink fallback="/composers" fallbackLabel="Composers" />
      <DetailHeader
        artwork={
          <ArtworkImage
            src={artwork}
            className="size-28 sm:size-48"
            rounded="rounded-lg"
          />
        }
        eyebrow={
          <>
            {form?.singular ?? 'Work'}
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
          </div>
          {/* Reading matter, as chips like the composer page: these leave the
              app, so they shouldn't compete with Play for a thumb. */}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={imslpSearchUrl(`${work.title} ${work.composerName}`)}
              target="_blank"
              rel="noreferrer"
              title="Find the sheet music on IMSLP, the free public-domain score library"
              className={chipClass}
            >
              Score on IMSLP ↗
            </a>
            {sungText && (
              <a
                href={sungText.url}
                target="_blank"
                rel="noreferrer"
                title="Read the words on Wikisource, the free public-domain text library"
                className={chipClass}
              >
                {sungText.label} ↗
              </a>
            )}
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
                  {plural(r.tracks.length, 'movement')} · {formatDuration(r.durationSec)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <TrackList
        tracks={recording.tracks}
        onPlay={(i) => playQueue(recording.tracks, i)}
        variant="movements"
      />

      <TermChips texts={[work.title, ...recording.tracks.map((t) => t.title)]} />

      <p className="mt-6 text-xs text-zinc-500">
        From{' '}
        <Link to={`/collection/${recording.collectionId}`} className="hover:underline">
          {recording.collectionName}
        </Link>{' '}
        · {recording.license}
      </p>
    </>
  )
}
