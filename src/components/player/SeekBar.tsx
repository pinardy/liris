import { useState, type CSSProperties } from 'react'
import { usePlayerStore } from '../../player/playerStore'
import { formatDuration } from '../../lib/format'

/**
 * The only component that subscribes to positionSec — keeps the ~2/sec
 * timeupdate writes from re-rendering anything else.
 */
export default function SeekBar() {
  const positionSec = usePlayerStore((s) => s.positionSec)
  const durationSec = usePlayerStore((s) => s.durationSec)
  const bufferedSec = usePlayerStore((s) => s.bufferedSec)
  const seek = usePlayerStore((s) => s.seek)
  const [dragValue, setDragValue] = useState<number | null>(null)

  const value = dragValue ?? positionSec
  const max = Math.max(durationSec, 1)

  // Wired to every way a drag can end — up, cancel, blur, key release — so a
  // pointer released off-element can't strand the bar on a stale local value.
  function commit() {
    if (dragValue !== null) {
      seek(dragValue)
      setDragValue(null)
    }
  }

  // Live radio streams have no duration — show a LIVE badge instead of a bar.
  if (durationSec === 0 && positionSec > 0) {
    return (
      <div className="flex w-full items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        <span className="size-2 animate-pulse rounded-full bg-red-500" />
        Live
      </div>
    )
  }

  const playedPct = Math.min(100, (Math.min(value, max) / max) * 100)
  const bufferedPct = Math.min(100, Math.max(playedPct, (bufferedSec / max) * 100))

  return (
    <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-zinc-400">
      <span className="w-9 text-right">{formatDuration(value)}</span>
      {/* The input is a tall touch target; .player-range paints the slim
          track from --range-fill: played, then buffered, then the rest. */}
      <input
        type="range"
        min={0}
        max={max}
        step="any"
        value={Math.min(value, max)}
        aria-label="Seek"
        aria-valuetext={`${formatDuration(value)} of ${formatDuration(durationSec)}`}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onPointerUp={commit}
        onPointerCancel={commit}
        onBlur={commit}
        onKeyUp={commit}
        className="player-range h-10 min-w-0 flex-1 cursor-pointer md:h-6"
        style={
          {
            '--range-fill': `linear-gradient(to right, var(--color-accent) ${playedPct}%, #52525b ${playedPct}% ${bufferedPct}%, #3f3f46 ${bufferedPct}%)`,
          } as CSSProperties
        }
      />
      <span className="w-9">{formatDuration(durationSec)}</span>
    </div>
  )
}
