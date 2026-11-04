import { usePlayerStore, type SleepTimerOption } from '../../player/playerStore'
import { MoonIcon } from '../common/icons'
import Popover from '../common/Popover'

const OPTIONS: { label: string; value: SleepTimerOption; title?: string }[] = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: 'End of track', value: 'track-end' },
  {
    label: 'End of work',
    value: 'work-end',
    title: 'Pause after the last movement of the current work',
  },
]

export default function SleepTimerMenu() {
  const sleepTimer = usePlayerStore((s) => s.sleepTimer)
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer)

  const status =
    sleepTimer?.kind === 'at'
      ? `${Math.max(1, Math.ceil((sleepTimer.endsAt - Date.now()) / 60_000))}m left`
      : sleepTimer?.kind === 'track-end'
        ? 'end of track'
        : sleepTimer?.kind === 'work-end'
          ? 'end of work'
          : null

  return (
    <Popover
      label="Sleep timer"
      active={sleepTimer !== null}
      trigger={<MoonIcon width="18" height="18" />}
      closeLabel="Close sleep timer menu"
      panelClassName="w-44 py-1"
    >
      {(close) => (
        <>
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Sleep timer
            {status && <span className="ml-1 normal-case text-accent">· {status}</span>}
          </p>
          {OPTIONS.map((o) => (
            <button
              key={o.label}
              type="button"
              title={o.title}
              onClick={() => {
                setSleepTimer(o.value)
                close()
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-700"
            >
              {o.label}
            </button>
          ))}
          {sleepTimer !== null && (
            <button
              type="button"
              onClick={() => {
                setSleepTimer(null)
                close()
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-red-300 hover:bg-zinc-700"
            >
              Turn off
            </button>
          )}
        </>
      )}
    </Popover>
  )
}
