import { useState } from 'react'
import { usePlayerStore } from '../../player/playerStore'
import { formatDuration } from '../../lib/format'

/**
 * The only component that subscribes to positionSec — keeps the ~2/sec
 * timeupdate writes from re-rendering anything else.
 */
export default function SeekBar() {
  const positionSec = usePlayerStore((s) => s.positionSec)
  const durationSec = usePlayerStore((s) => s.durationSec)
  const seek = usePlayerStore((s) => s.seek)
  const [dragValue, setDragValue] = useState<number | null>(null)

  const value = dragValue ?? positionSec
  const max = Math.max(durationSec, 1)

  // Live radio streams have no duration — show a LIVE badge instead of a bar.
  if (durationSec === 0 && positionSec > 0) {
    return (
      <div className="flex w-full items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        <span className="size-2 animate-pulse rounded-full bg-red-500" />
        Live
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-zinc-400">
      <span className="w-9 text-right">{formatDuration(value)}</span>
      <input
        type="range"
        min={0}
        max={max}
        step="any"
        value={Math.min(value, max)}
        aria-label="Seek"
        onChange={(e) => setDragValue(Number(e.target.value))}
        onPointerUp={() => {
          if (dragValue !== null) {
            seek(dragValue)
            setDragValue(null)
          }
        }}
        onKeyUp={() => {
          if (dragValue !== null) {
            seek(dragValue)
            setDragValue(null)
          }
        }}
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-accent"
      />
      <span className="w-9">{formatDuration(durationSec)}</span>
    </div>
  )
}
