/**
 * Tiny app-wide toast bus. Actions with no visible result ("Add to queue")
 * call toast(); the Toaster component subscribes and renders. Safe to call
 * before the Toaster mounts — the message is simply dropped.
 */

type Listener = (message: string) => void
const listeners = new Set<Listener>()

export function onToast(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function toast(message: string): void {
  listeners.forEach((l) => l(message))
}
