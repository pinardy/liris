import { Link } from 'react-router'
import { useTrackArtwork } from '../../hooks/useTrackArtwork'
import { workIdForTrack } from '../../lib/classical'
import { usePlayerStore, selectCurrentTrack } from '../../player/playerStore'
import ArtworkImage from '../common/ArtworkImage'
import {
  CloseIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
} from '../common/icons'
import SeekBar from './SeekBar'

/** Mobile full-screen now-playing view. */
export default function NowPlayingSheet({ onClose }: { onClose: () => void }) {
  const track = usePlayerStore(selectCurrentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)
  const artworkUrl = useTrackArtwork(track)
  const workId = track ? workIdForTrack(track) : undefined

  if (!track) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-950 p-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close now playing"
          className="text-zinc-300 hover:text-white"
        >
          <CloseIcon width="24" height="24" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <ArtworkImage
          src={artworkUrl}
          className="aspect-square w-full max-w-xs"
          rounded="rounded-xl"
        />
        <div className="w-full max-w-xs text-center">
          <p className="truncate text-xl font-bold">{track.title}</p>
          {track.album && track.album !== track.title && (
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
          <p className="truncate text-sm text-zinc-400">{track.artist}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md pb-6">
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
