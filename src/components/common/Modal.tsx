import type { ReactNode } from 'react'
import { useBackDismiss } from '../../hooks/useBackDismiss'
import { CloseIcon } from './icons'

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  // A mobile back swipe closes the dialog like the X button does.
  useBackDismiss(onClose)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-white"
          >
            <CloseIcon width="18" height="18" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
