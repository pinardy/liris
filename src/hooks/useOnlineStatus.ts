import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/**
 * Whether the browser currently believes it has a network.
 *
 * `navigator.onLine` only reports the absence of a connection, never a
 * captive portal or a dead uplink — so treat a false here as certainly
 * offline, and a true as "worth attempting".
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // assume online while server-rendering / before hydration
  )
}
