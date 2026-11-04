import { useState, type ReactNode } from 'react'
import { useOverlayDismiss } from '../../hooks/useOverlayDismiss'

interface Props {
  /** Accessible name of the trigger button. */
  label: string
  /** Tints the trigger to show the feature is in effect (speed ≠ 1×, timer set). */
  active?: boolean
  trigger: ReactNode
  triggerClassName?: string
  /** Width and padding of the panel, e.g. 'w-48 py-1'. */
  panelClassName: string
  closeLabel?: string
  /** Receives `close` so a choice can dismiss the panel. */
  children: (close: () => void) => ReactNode
}

/**
 * A small panel anchored above its trigger: the player-bar menus. Owns the
 * open state, the scrim behind the panel, and dismissal by Escape or a mobile
 * back swipe. No focus trap: the trigger stays right there behind it.
 */
export default function Popover({
  label,
  active = false,
  trigger,
  triggerClassName = '',
  panelClassName,
  closeLabel = 'Close',
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  useOverlayDismiss(close, open)

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className={`flex size-11 items-center justify-center ${
          active ? 'text-accent' : 'text-zinc-400 hover:text-white'
        } ${triggerClassName}`}
      >
        {trigger}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={closeLabel}
            className="fixed inset-0 z-30 cursor-default"
            onClick={close}
          />
          <div
            className={`absolute bottom-full right-0 z-40 mb-2 rounded-md border border-zinc-700 bg-zinc-800 shadow-xl ${panelClassName}`}
          >
            {children(close)}
          </div>
        </>
      )}
    </span>
  )
}
