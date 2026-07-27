import { Link } from 'react-router'
import { workDuration, workPerformers, workTracks, type Work } from '../../lib/classical'
import { formatDuration } from '../../lib/format'
import { usePlayerStore } from '../../player/playerStore'
import { PlayIcon } from '../common/icons'

/**
 * Compact list entry for a work — used on composer, period and form pages
 * where the composer's name would be repeated on every row.
 */
export default function WorkRow({
  work,
  showComposer = false,
}: {
  work: Work
  showComposer?: boolean
}) {
  const playQueue = usePlayerStore((s) => s.playQueue)
  const tracks = workTracks(work)
  const performers = workPerformers(work)

  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-800/70">
      <button
        type="button"
        onClick={() => playQueue(tracks, 0)}
        aria-label={`Play ${work.title}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors group-hover:bg-accent group-hover:text-black"
      >
        <PlayIcon width="14" height="14" className="translate-x-px" />
      </button>
      <Link to={`/work/${work.id}`} className="min-w-0 flex-1">
        {showComposer && (
          <span className="block truncate text-xs text-accent">{work.composerName}</span>
        )}
        <span className="block truncate text-sm font-medium">{work.title}</span>
        <span className="block truncate text-xs text-zinc-400">
          {tracks.length > 1 ? `${tracks.length} movements` : '1 movement'}
          {performers.length > 0 && ` · ${performers.join(', ')}`}
          {work.recordings.length > 1 && ` · ${work.recordings.length} recordings`}
        </span>
      </Link>
      <span className="shrink-0 text-sm tabular-nums text-zinc-400">
        {formatDuration(workDuration(work))}
      </span>
    </div>
  )
}
