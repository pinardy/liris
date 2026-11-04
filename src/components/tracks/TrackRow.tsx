import { useContext, type ReactNode } from 'react'
import type { Track } from '../../types/model'
import { useTrackArtwork } from '../../hooks/useTrackArtwork'
import { formatDuration } from '../../lib/format'
import { usePlayerStore } from '../../player/playerStore'
import ArtworkImage from '../common/ArtworkImage'
import { DownloadIcon, PlayIcon } from '../common/icons'
import { DownloadedIdsContext } from './favoritesContext'

interface Props {
  track: Track
  index: number
  onPlay: () => void
  /** Slot for context actions (favorite, add-to-playlist). */
  actions?: ReactNode
}

export default function TrackRow({ track, index, onPlay, actions }: Props) {
  // Each row subscribes to its own boolean so a track change re-renders only
  // the two affected rows — not the page and every list on it.
  const isCurrent = usePlayerStore((s) => s.queue[s.currentIndex]?.id === track.id)
  const artworkUrl = useTrackArtwork(track)
  // Which rows will still play with no network — the whole point of the
  // download feature, and previously only discoverable through a menu label.
  const isDownloaded = useContext(DownloadedIdsContext)?.has(track.id) ?? false

  return (
    <div
      className={`group grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 [contain-intrinsic-size:auto_52px] [content-visibility:auto] hover:bg-zinc-800/70 md:grid-cols-[2rem_4fr_3fr_auto] has-[[aria-expanded=true]]:[content-visibility:visible] ${
        isCurrent ? 'text-accent' : ''
      }`}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${track.title}`}
        className="relative flex size-11 items-center justify-center text-sm text-zinc-400 md:size-8"
      >
        <span className="group-hover:invisible">{index + 1}</span>
        <PlayIcon
          width="16"
          height="16"
          className="invisible absolute text-white group-hover:visible"
        />
      </button>

      <button
        type="button"
        onClick={onPlay}
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <ArtworkImage src={artworkUrl} className="size-10" />
        <span className="min-w-0">
          <span
            className={`block truncate text-sm font-medium ${isCurrent ? 'text-accent' : 'text-white'}`}
          >
            {track.title}
          </span>
          <span className="block truncate text-xs text-zinc-400">{track.artist}</span>
        </span>
      </button>

      <span className="hidden min-w-0 truncate text-sm text-zinc-400 md:block">
        {track.album ?? ''}
      </span>

      <span className="flex items-center gap-2">
        {isDownloaded && (
          // The icon itself is aria-hidden by design, so the label rides
          // alongside it rather than on it.
          <span className="flex shrink-0 items-center text-accent" title="Available offline">
            <DownloadIcon width="13" height="13" />
            <span className="sr-only">Available offline</span>
          </span>
        )}
        {actions}
        <span className="text-sm tabular-nums text-zinc-400">
          {formatDuration(track.durationSec)}
        </span>
      </span>
    </div>
  )
}
