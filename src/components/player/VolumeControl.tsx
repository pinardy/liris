import { isIOS } from '../../lib/platform'
import { usePlayerStore } from '../../player/playerStore'
import { VolumeIcon, VolumeMuteIcon } from '../common/icons'

export default function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)

  // iOS ignores programmatic volume; hide the slider there.
  if (isIOS) return null

  return (
    <div className="hidden items-center gap-2 md:flex">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="text-zinc-400 hover:text-white"
      >
        {muted || volume === 0 ? (
          <VolumeMuteIcon width="18" height="18" />
        ) : (
          <VolumeIcon width="18" height="18" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={muted ? 0 : volume}
        aria-label="Volume"
        onChange={(e) => setVolume(Number(e.target.value))}
        className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-accent"
      />
    </div>
  )
}
