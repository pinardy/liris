import { usePlayerStore } from '../../player/playerStore'

/**
 * Hairline progress fill for the mobile mini player, which has no room for a
 * scrubber. Purely indicative — seeking lives in the now-playing sheet. Like
 * SeekBar, this is deliberately the only other subscriber to positionSec so
 * the ~2/sec updates don't re-render the rest of the player bar.
 */
export default function MiniProgress() {
  const positionSec = usePlayerStore((s) => s.positionSec)
  const durationSec = usePlayerStore((s) => s.durationSec)
  const bufferedSec = usePlayerStore((s) => s.bufferedSec)

  // Live radio has no duration to show progress against.
  if (durationSec <= 0) return null
  const pct = Math.min(100, (positionSec / durationSec) * 100)
  const bufferedPct = Math.min(100, Math.max(pct, (bufferedSec / durationSec) * 100))

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-0.5 bg-zinc-800 md:hidden"
    >
      <div
        className="absolute inset-y-0 left-0 bg-zinc-700"
        style={{ width: `${bufferedPct}%` }}
      />
      <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
    </div>
  )
}
