import { useState } from 'react'
import { useBackDismiss } from '../../hooks/useBackDismiss'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { usePlayerStore, type SleepTimerOption } from '../../player/playerStore'
import { MoonIcon } from '../common/icons'

const OPTIONS = [15, 30, 45, 60] as const

export default function SleepTimerMenu() {
  const sleepTimer = usePlayerStore((s) => s.sleepTimer)
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer)
  const [open, setOpen] = useState(false)
  // A mobile back swipe closes the menu while it's open.
  useBackDismiss(() => setOpen(false), open)
  useEscapeKey(open, () => setOpen(false))

  const active = sleepTimer !== null
  const status =
    sleepTimer?.kind === 'at'
      ? `${Math.max(1, Math.ceil((sleepTimer.endsAt - Date.now()) / 60_000))}m left`
      : sleepTimer?.kind === 'track-end'
        ? 'end of track'
        : sleepTimer?.kind === 'work-end'
          ? 'end of work'
          : null

  function pick(option: SleepTimerOption) {
    setSleepTimer(option)
    setOpen(false)
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Sleep timer"
        aria-expanded={open}
        className={`flex size-11 items-center justify-center ${active ? 'text-accent' : 'text-zinc-400 hover:text-white'}`}
      >
        <MoonIcon width="18" height="18" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close sleep timer menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full right-0 z-40 mb-2 w-44 rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Sleep timer
              {status && <span className="ml-1 normal-case text-accent">· {status}</span>}
            </p>
            {OPTIONS.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => pick(min)}
                className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-700"
              >
                {min} minutes
              </button>
            ))}
            <button
              type="button"
              onClick={() => pick('track-end')}
              className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-700"
            >
              End of track
            </button>
            <button
              type="button"
              onClick={() => pick('work-end')}
              title="Pause after the last movement of the current work"
              className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-700"
            >
              End of work
            </button>
            {active && (
              <button
                type="button"
                onClick={() => pick(null)}
                className="block w-full px-3 py-1.5 text-left text-sm text-red-300 hover:bg-zinc-700"
              >
                Turn off
              </button>
            )}
          </div>
        </>
      )}
    </span>
  )
}
