import { PLAYBACK_RATES, usePlayerStore } from '../../player/playerStore'
import Popover from '../common/Popover'

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

  return (
    <Popover
      label={`Playback speed: ${formatRate(playbackRate)}`}
      active={playbackRate !== 1}
      trigger={formatRate(playbackRate)}
      triggerClassName="text-xs font-bold tabular-nums"
      closeLabel="Close speed menu"
      panelClassName="w-48 py-1"
    >
      {(close) => (
        <>
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
                  close()
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
          <p className="px-3 pb-1.5 text-[10px] leading-snug text-zinc-400">
            {preservePitch
              ? 'Speed changes, pitch stays — for slow practice.'
              : 'Turntable mode: slower also means lower. ≈.944× lands near A415.'}
          </p>
        </>
      )}
    </Popover>
  )
}
