import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useDialogBehavior } from '../../hooks/useDialogBehavior'
import { useSwipe } from '../../hooks/useSwipe'
import { useTrackArtwork } from '../../hooks/useTrackArtwork'
import { workIdForTrack, workSlice } from '../../lib/classical'
import { findComposer } from '../../lib/composers'
import { formatDuration } from '../../lib/format'
import { usePlayerStore, selectCurrentTrack } from '../../player/playerStore'
import TermChips from '../classical/TermChips'
import PlaybackSpeedMenu from './PlaybackSpeedMenu'
import SleepTimerMenu from './SleepTimerMenu'
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
import BookmarkButton from './BookmarkButton'
import SeekBar from './SeekBar'

/** Full-screen now-playing view, with program notes for the current work. */
export default function NowPlayingSheet({ onClose }: { onClose: () => void }) {
  const track = usePlayerStore(selectCurrentTrack)
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const isLoading = usePlayerStore((s) => s.isLoading)
  const resumeAt = usePlayerStore((s) =>
    s.restoredFromSession && s.positionSec > 1 ? s.positionSec : null,
  )
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

  const sheetRef = useRef<HTMLDivElement>(null)
  useDialogBehavior(sheetRef, onClose)
  // Flick down to dismiss — the counterpart to the flick up that opened it.
  // Attached only to the non-scrolling regions, never the notes list.
  const swipeDown = useSwipe({ onSwipeDown: onClose })

  if (!track) return null

  const { start, end } = workSlice(queue, currentIndex)
  const movements = queue.slice(start, end)
  const isWork = Boolean(track.album) && track.album !== track.title
  const surname = findComposer(track.artist)?.surname ?? track.artist

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      tabIndex={-1}
      className="p-6-safe fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-950 focus:outline-none"
    >
      <div {...swipeDown}>
        {/* Grabber: the affordance for the flick-down dismiss. */}
        <div
          aria-hidden="true"
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-600 md:hidden"
        />
      </div>
      <div {...swipeDown} className="-mr-2 flex items-center justify-end gap-1">
        <BookmarkButton className="text-zinc-300 hover:text-white" />
        {isWork && (
          <button
            type="button"
            onClick={() => setShowNotes((s) => !s)}
            aria-label="About this work"
            aria-pressed={showNotes}
            className={`flex size-11 items-center justify-center ${
              showNotes ? 'text-accent' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <InfoIcon width="22" height="22" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close now playing"
          className="flex size-11 items-center justify-center text-zinc-300 hover:text-white"
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
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{m.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-400">
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
        <div
          {...swipeDown}
          className="flex flex-1 flex-col items-center justify-center gap-8"
        >
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
                <span className="text-zinc-400">
                  {' '}
                  · Movement {currentIndex - start + 1} of {movements.length}
                </span>
              )}
            </p>
            {/* The queue came back from the last session; say so, otherwise a
                pre-filled position looks like a bug rather than a resume. */}
            {resumeAt !== null && (
              <p className="mt-2 text-xs text-accent">
                Picks up where you left off · {formatDuration(resumeAt)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-md pb-6 pt-4">
        <SeekBar />
        <div className="mt-4 flex items-center justify-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label={shuffle ? 'Shuffle on' : 'Shuffle off'}
            aria-pressed={shuffle}
            // An underline carries the on-state alongside the accent colour,
            // which on its own is invisible to a colourblind listener.
            className={`relative flex size-11 items-center justify-center ${
              shuffle
                ? 'text-accent after:absolute after:bottom-1.5 after:h-0.5 after:w-4 after:rounded-full after:bg-accent'
                : 'text-zinc-400'
            }`}
          >
            <ShuffleIcon width="20" height="20" />
          </button>
          <button type="button" onClick={prev} aria-label="Previous track" className="flex size-11 items-center justify-center text-white">
            <SkipPrevIcon width="30" height="30" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={
              isLoading
                ? 'Loading'
                : isPlaying
                  ? 'Pause'
                  : resumeAt !== null
                    ? `Resume from ${formatDuration(resumeAt)}`
                    : 'Play'
            }
            className="flex size-16 items-center justify-center rounded-full bg-white text-black"
          >
            {isLoading ? (
              <span
                aria-hidden="true"
                className="size-6 animate-spin rounded-full border-[3px] border-black/25 border-t-black"
              />
            ) : isPlaying ? (
              <PauseIcon width="26" height="26" />
            ) : (
              <PlayIcon width="26" height="26" className="translate-x-0.5" />
            )}
          </button>
          <button type="button" onClick={() => next()} aria-label="Next track" className="flex size-11 items-center justify-center text-white">
            <SkipNextIcon width="30" height="30" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={
              repeat === 'off'
                ? 'Repeat off'
                : repeat === 'one'
                  ? 'Repeat this track'
                  : 'Repeat the queue'
            }
            className={`relative flex size-11 items-center justify-center ${
              repeat !== 'off'
                ? 'text-accent after:absolute after:bottom-1.5 after:h-0.5 after:w-4 after:rounded-full after:bg-accent'
                : 'text-zinc-400'
            }`}
          >
            <RepeatIcon width="20" height="20" />
            {repeat === 'one' && (
              <span className="absolute right-1.5 top-1.5 text-[10px] font-bold">1</span>
            )}
          </button>
        </div>
        {/* Speed everywhere; the sleep timer is here only on mobile, where
            the mini player has no room for it. */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <PlaybackSpeedMenu />
          <span className="md:hidden">
            <SleepTimerMenu />
          </span>
        </div>
      </div>
    </div>
  )
}
