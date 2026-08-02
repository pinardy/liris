import { useState } from 'react'
import { useBackDismiss } from '../../hooks/useBackDismiss'
import { PLAYBACK_RATES, usePlayerStore } from '../../player/playerStore'

function formatRate(rate: number): string {
  return `${rate.toString().replace(/^0\./, '.')}×`
}

/**
 * Playback speed picker — the practice control. Shows the current rate as a
 * compact chip ('1×'), highlighted whenever it isn't normal so a slowed
 * session is never a mystery. Radio streams always play at 1× regardless.
 */
export default function PlaybackSpeedMenu() {
  const playbackRate = usePlayerStore((s) => s.playbackRate)
  const preservePitch = usePlayerStore((s) => s.preservePitch)
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate)
  const togglePreservePitch = usePlayerStore((s) => s.togglePreservePitch)
  const [open, setOpen] = useState(false)
  // A mobile back swipe closes the menu while it's open.
  useBackDismiss(() => setOpen(false), open)

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Playback speed: ${formatRate(playbackRate)}`}
        aria-expanded={open}
        className={`flex size-11 items-center justify-center text-xs font-bold tabular-nums ${
          playbackRate !== 1 ? 'text-accent' : 'text-zinc-400 hover:text-white'
        }`}
      >
        {formatRate(playbackRate)}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close speed menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full right-0 z-40 mb-2 w-48 rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Speed
            </p>
            <div className="grid grid-cols-5 gap-1 px-2 pb-1">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setPlaybackRate(rate)
                    setOpen(false)
                  }}
                  aria-pressed={playbackRate === rate}
                  className={`rounded px-1 py-1 text-xs tabular-nums ${
                    playbackRate === rate
                      ? 'bg-white font-bold text-black'
                      : 'text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {formatRate(rate)}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 border-t border-zinc-700 px-3 py-2 text-xs text-zinc-200">
              <input
                type="checkbox"
                checked={preservePitch}
                onChange={togglePreservePitch}
                className="accent-accent"
              />
              Keep pitch
            </label>
            <p className="px-3 pb-1.5 text-[10px] leading-snug text-zinc-500">
              {preservePitch
                ? 'Speed changes, pitch stays — for slow practice.'
                : 'Turntable mode: slower also means lower. ≈.944× lands near A415.'}
            </p>
          </div>
        </>
      )}
    </span>
  )
}
