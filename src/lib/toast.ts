/**
 * Tiny app-wide toast bus. Actions with no visible result ("Add to queue")
 * call toast(); the Toaster component subscribes and renders. Safe to call
 * before the Toaster mounts — the message is simply dropped.
 *
 * A toast may carry ONE action, which is what makes destructive edits
 * reversible ("Removed from playlist — Undo") instead of needing a
 * confirmation prompt in front of every one of them.
 */

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  action?: ToastAction
  /** Defaults to 4s, or 8s when an action is attached — an Undo you can't
   *  reach in time is worse than no Undo at all. */
  durationMs?: number
  tone?: 'default' | 'error'
}

export interface ToastPayload extends ToastOptions {
  message: string
}

type Listener = (toast: ToastPayload) => void
const listeners = new Set<Listener>()

export function onToast(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function toast(message: string, options: ToastOptions = {}): void {
  listeners.forEach((l) => l({ message, ...options }))
}
