import { Link } from 'react-router'
import { workArtwork, workDuration, workTracks, type Work } from '../../lib/classical'
import { formatDuration } from '../../lib/format'
import ArtworkImage from '../common/ArtworkImage'

/** Grid tile for a work: composer, title, movement count and duration. */
export default function WorkCard({ work }: { work: Work }) {
  const movements = workTracks(work).length
  return (
    <Link
      to={`/work/${work.id}`}
      className="group flex flex-col gap-2 rounded-lg bg-zinc-900/60 p-3 transition-colors hover:bg-zinc-800"
    >
      <ArtworkImage
        src={workArtwork(work)}
        className="aspect-square w-full"
        rounded="rounded-md"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-accent">{work.composerName}</p>
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{work.title}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-400">
          {movements > 1 ? `${movements} movements · ` : ''}
          {formatDuration(workDuration(work))}
          {work.recordings.length > 1 ? ` · ${work.recordings.length} recordings` : ''}
        </p>
      </div>
    </Link>
  )
}
