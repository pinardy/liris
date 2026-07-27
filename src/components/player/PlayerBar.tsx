import { useState } from 'react'
import { useTrackArtwork } from '../../hooks/useTrackArtwork'
import { usePlayerStore, selectCurrentTrack } from '../../player/playerStore'
import ArtworkImage from '../common/ArtworkImage'
import {
  MusicNoteIcon,
  PauseIcon,
  PlayIcon,
  QueueIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
} from '../common/icons'
import EqualizerPanel from './EqualizerPanel'
import NowPlayingSheet from './NowPlayingSheet'
import QueuePanel from './QueuePanel'
import SeekBar from './SeekBar'
import SleepTimerMenu from './SleepTimerMenu'
import VolumeControl from './VolumeControl'

export default function PlayerBar() {
  const track = usePlayerStore(selectCurrentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)
  const [queueOpen, setQueueOpen] = useState(false)
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false)
  const artworkUrl = useTrackArtwork(track)

  if (!track) {
    return (
      <footer className="flex h-20 items-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4">
        <div className="flex size-12 items-center justify-center rounded bg-zinc-800 text-zinc-600">
          <MusicNoteIcon />
        </div>
        <p className="text-sm text-zinc-500">
          Nothing playing yet — pick a track to start listening.
        </p>
      </footer>
    )
  }

  return (
    <>
      {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}
      {nowPlayingOpen && <NowPlayingSheet onClose={() => setNowPlayingOpen(false)} />}
      <footer className="grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-zinc-800 bg-zinc-900 px-4 md:grid-cols-[1fr_2fr_1fr]">
        {/* Now playing — tapping opens the full-screen view on mobile */}
        <button
          type="button"
          onClick={() => setNowPlayingOpen(true)}
          className="flex min-w-0 items-center gap-3 text-left md:pointer-events-none"
          aria-label="Open now playing"
        >
          <ArtworkImage src={artworkUrl} className="size-12" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{track.title}</p>
            <p className="truncate text-xs text-zinc-400">{track.artist}</p>
          </div>
        </button>

        {/* Controls + seek */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              aria-pressed={shuffle}
              className={`hidden md:block ${shuffle ? 'text-accent' : 'text-zinc-400 hover:text-white'}`}
            >
              <ShuffleIcon width="17" height="17" />
            </button>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous track"
              className="text-zinc-300 hover:text-white"
            >
              <SkipPrevIcon />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex size-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
            >
              {isPlaying ? (
                <PauseIcon width="18" height="18" />
              ) : (
                <PlayIcon width="18" height="18" className="translate-x-px" />
              )}
            </button>
            <button
              type="button"
              onClick={() => next()}
              aria-label="Next track"
              className="text-zinc-300 hover:text-white"
            >
              <SkipNextIcon />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              className={`relative hidden md:block ${repeat !== 'off' ? 'text-accent' : 'text-zinc-400 hover:text-white'}`}
            >
              <RepeatIcon width="17" height="17" />
              {repeat === 'one' && (
                <span className="absolute -right-1 -top-1 text-[9px] font-bold">1</span>
              )}
            </button>
          </div>
          <div className="hidden w-full max-w-xl md:block">
            <SeekBar />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center justify-end gap-3">
          <EqualizerPanel />
          <SleepTimerMenu />
          <button
            type="button"
            onClick={() => setQueueOpen((o) => !o)}
            aria-label="Toggle queue"
            className={queueOpen ? 'text-accent' : 'text-zinc-400 hover:text-white'}
          >
            <QueueIcon width="18" height="18" />
          </button>
          <VolumeControl />
        </div>
      </footer>
    </>
  )
}
