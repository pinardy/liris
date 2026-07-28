/**
 * Minimal typed event bus for UI actions triggered from outside the owning
 * component (e.g. the global 'Q' shortcut toggling PlayerBar's queue panel).
 * Same shape as the toast bus: emitting with no listener is a silent no-op.
 */

export type AppEvent = 'toggle-queue'

const listeners = new Map<AppEvent, Set<() => void>>()

export function onAppEvent(event: AppEvent, listener: () => void): () => void {
  let set = listeners.get(event)
  if (!set) {
    set = new Set()
    listeners.set(event, set)
  }
  set.add(listener)
  return () => set.delete(listener)
}

export function emitAppEvent(event: AppEvent): void {
  listeners.get(event)?.forEach((l) => l())
}
