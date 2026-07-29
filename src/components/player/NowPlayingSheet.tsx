import { useState } from 'react'
import { Link } from 'react-router'
import { useBackDismiss } from '../../hooks/useBackDismiss'
import { useTrackArtwork } from '../../hooks/useTrackArtwork'
import { isSameWork, workIdForTrack } from '../../lib/classical'
import { findComposer } from '../../lib/composers'
import { formatDuration } from '../../lib/format'
import { usePlayerStore, selectCurrentTrack } from '../../player/playerStore'
import TermChips from '../classical/TermChips'
import AboutBlurb from '../common/AboutBlurb'
import ArtworkImage from '../common/ArtworkImage'
import {
  CloseIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
} from '../common/icons'
import { searchSummary } from '../../services/wikipedia'
import type { Track } from '../../types/model'
import BookmarkButton from './BookmarkButton'
import SeekBar from './SeekBar'

/** The contiguous run of queue tracks belonging to the current work —
 *  i.e. this performance's movements, in order. */
function workSlice(queue: Track[], currentIndex: number): { start: number; end: number } {
  const current = queue[currentIndex]
  if (!current?.album) return { start: currentIndex, end: currentIndex + 1 }
  let start = currentIndex
  while (start > 0 && isSameWork(queue[start - 1], current)) start--
  let end = currentIndex + 1
  while (end < queue.length && isSameWork(queue[end], current)) end++
  return { start, end }
}

/** Full-screen now-playing view, with program notes for the current work. */
export default function NowPlayingSheet({ onClose }: { onClose: () => void }) {
  const track = usePlayerStore(selectCurrentTrack)
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)
  const playFromQueue = usePlayerStore((s) => s.playFromQueue)
  const [showNotes, setShowNotes] = useState(false)
  const artworkUrl = useTrackArtwork(track)
  const workId = track ? workIdForTrack(track) : undefined

  // A mobile back swipe closes the sheet like the X button does.
  useBackDismiss(onClose)

  if (!track) return null

  const { start, end } = workSlice(queue, currentIndex)
  const movements = queue.slice(start, end)
  const isWork = Boolean(track.album) && track.album !== track.title
  const surname = findComposer(track.artist)?.surname ?? track.artist

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-950 p-6">
      <div className="flex items-center justify-end gap-5">
        <BookmarkButton className="text-zinc-300 hover:text-white" />
        {isWork && (
          <button
            type="button"
            onClick={() => setShowNotes((s) => !s)}
            aria-label="About this work"
            aria-pressed={showNotes}
            className={showNotes ? 'text-accent' : 'text-zinc-300 hover:text-white'}
          >
            <InfoIcon width="22" height="22" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close now playing"
          className="text-zinc-300 hover:text-white"
        >
          <CloseIcon width="24" height="24" />
        </button>
      </div>

      {showNotes && isWork ? (
        /* Program notes: what's playing, its movements, and context to read
           while listening. Replaces the artwork so nothing else moves. */
        <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            About this work
          </p>
          <h2 className="mt-1 text-lg font-bold">
            {workId ? (
              <Link to={`/work/${workId}`} onClick={onClose} className="hover:underline">
                {track.album}
              </Link>
            ) : (
              track.album
            )}
          </h2>
          <p className="text-sm text-zinc-400">{track.artist}</p>

          <div className="mt-4">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Movements
            </h3>
            {movements.map((m, i) => {
              const qIndex = start + i
              const isCurrent = qIndex === currentIndex
              return (
                <button
                  key={`${m.id}-${qIndex}`}
                  type="button"
                  onClick={() => playFromQueue(qIndex)}
                  className={`flex w-full items-baseline gap-3 rounded-md px-2 py-1.5 text-left hover:bg-zinc-800/70 ${
                    isCurrent ? 'text-accent' : 'text-zinc-200'
                  }`}
                >
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{m.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                    {formatDuration(m.durationSec)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            <AboutBlurb
              cacheKey={`wiki:work:${workId ?? track.album}`}
              load={() => searchSummary(`${track.album} ${surname}`, surname)}
            />
          </div>

          <TermChips texts={[track.album ?? '', ...movements.map((m) => m.title)]} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <ArtworkImage
            src={artworkUrl}
            className="aspect-square w-full max-w-xs"
            rounded="rounded-xl"
          />
          <div className="w-full max-w-xs text-center">
            <p className="truncate text-xl font-bold">{track.title}</p>
            {isWork && (
              <p className="mt-1 truncate text-sm text-zinc-300">
                {workId ? (
                  <Link
                    to={`/work/${workId}`}
                    onClick={onClose}
                    className="hover:underline"
                  >
                    {track.album}
                  </Link>
                ) : (
                  track.album
                )}
              </p>
            )}
            <p className="truncate text-sm text-zinc-400">
              {track.artist}
              {isWork && movements.length > 1 && (
                <span className="text-zinc-500">
                  {' '}
                  · Movement {currentIndex - start + 1} of {movements.length}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-md pb-6 pt-4">
        <SeekBar />
        <div className="mt-4 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            aria-pressed={shuffle}
            className={shuffle ? 'text-accent' : 'text-zinc-400'}
          >
            <ShuffleIcon width="20" height="20" />
          </button>
          <button type="button" onClick={prev} aria-label="Previous track" className="text-white">
            <SkipPrevIcon width="30" height="30" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex size-16 items-center justify-center rounded-full bg-white text-black"
          >
            {isPlaying ? (
              <PauseIcon width="26" height="26" />
            ) : (
              <PlayIcon width="26" height="26" className="translate-x-0.5" />
            )}
          </button>
          <button type="button" onClick={() => next()} aria-label="Next track" className="text-white">
            <SkipNextIcon width="30" height="30" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
            className={`relative ${repeat !== 'off' ? 'text-accent' : 'text-zinc-400'}`}
          >
            <RepeatIcon width="20" height="20" />
            {repeat === 'one' && (
              <span className="absolute -right-1 -top-1 text-[9px] font-bold">1</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
