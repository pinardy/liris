import type { ReactNode } from 'react'
import Modal from './Modal'
import { buttonClass } from './buttonStyles'

export interface ConfirmRequest {
  title: string
  /** What is about to happen, and why it can't be undone. */
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => void
}

/**
 * Themed replacement for window.confirm, which is unstyled, ignores the app's
 * dark theme, and is suppressed outright in some installed-PWA contexts —
 * meaning a "confirmed" destructive action could silently never happen.
 *
 * Only for genuinely irreversible things (deleting imported audio, wiping
 * history). Anything restorable should ship an Undo toast instead: undo costs
 * the user nothing when they meant it, a prompt costs them a click every time.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}: ConfirmRequest & { onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-sm text-zinc-300">{message}</div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={buttonClass('subtle', 'sm')}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={buttonClass('primary', 'sm', 'bg-red-600 text-white hover:bg-red-500')}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
