import { useCallback, useEffect, useRef, useState } from 'react'
import { onToast, type ToastPayload } from '../../lib/toast'
import { CloseIcon } from './icons'

interface ToastItem extends ToastPayload {
  id: number
}

/** Set by the stale-chunk recovery in lib/stability just before it reloads. */
const RELOADED_FOR_UPDATE = 'reloaded-for-update'

const DEFAULT_MS = 4000
/** Anything with an action gets longer — you have to read it, then click. */
const ACTION_MS = 8000
/** A failing queue can produce a burst; never wallpaper the screen with them. */
const MAX_VISIBLE = 3

let toastId = 0

/** Lightweight toast list: playback errors plus app-wide action confirmations. */
export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const pending = timers.current
    function push(payload: ToastPayload) {
      const id = ++toastId
      const ms = payload.durationMs ?? (payload.action ? ACTION_MS : DEFAULT_MS)
      setToasts((current) => {
        // Identical messages replace rather than stack: ten unreachable tracks
        // in a row should read as one problem, not ten. A toast carrying an
        // unused action is never collapsed away, though — dropping it would
        // silently take an Undo the user can still legitimately want.
        const kept = current.filter((t) => t.action || t.message !== payload.message)
        const next = [...kept, { ...payload, id }]
        if (next.length <= MAX_VISIBLE) return next
        // Over the cap: shed the oldest actionless toasts first, and only fall
        // back to dropping action toasts if that's all there is.
        const excess = next.length - MAX_VISIBLE
        const droppable = next.filter((t) => !t.action).slice(0, excess)
        const trimmed = next.filter((t) => !droppable.includes(t))
        return trimmed.slice(-MAX_VISIBLE)
      })
      pending.set(
        id,
        setTimeout(() => {
          pending.delete(id)
          setToasts((current) => current.filter((t) => t.id !== id))
        }, ms),
      )
    }
    const offToast = onToast(push)

    // Explain a reload that already happened for a stale chunk. It has to be
    // raised here rather than by the component that set the flag: toast() only
    // reaches subscribers, and this effect is where the subscription begins.
    if (sessionStorage.getItem(RELOADED_FOR_UPDATE)) {
      sessionStorage.removeItem(RELOADED_FOR_UPDATE)
      push({
        message: 'Liris updated to a new version — playback was interrupted.',
        durationMs: 7000,
      })
    }

    return () => {
      offToast()
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  return (
    // Always mounted so the live region exists before a message arrives —
    // screen readers ignore announcements from an element added at the same
    // moment as its text. Container ignores pointer events; each toast opts
    // back in, so toasts never block the player bar underneath.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-36 left-1/2 z-50 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 md:bottom-24"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-md py-2 pl-4 pr-2 text-sm shadow-lg ${
            t.tone === 'error'
              ? 'bg-red-950 text-red-100 ring-1 ring-red-800'
              : 'bg-zinc-800 text-white'
          }`}
        >
          <span className="min-w-0 flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick()
                dismiss(t.id)
              }}
              className="shrink-0 rounded px-2 py-1 text-sm font-bold text-accent hover:bg-white/10"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="flex size-8 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon width="14" height="14" />
          </button>
        </div>
      ))}
    </div>
  )
}
