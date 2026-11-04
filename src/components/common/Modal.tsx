import { useRef, type ReactNode } from 'react'
import { useDialogBehavior } from '../../hooks/useDialogBehavior'
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
  const panelRef = useRef<HTMLDivElement>(null)
  // Escape, back swipe, focus trap and focus restore — none of which a plain div has.
  useDialogBehavior(panelRef, onClose)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl focus:outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-2 flex size-9 items-center justify-center rounded text-zinc-400 hover:text-white"
          >
            <CloseIcon width="18" height="18" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
