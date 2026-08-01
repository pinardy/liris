import { toast } from './toast'

/**
 * App-wide failure nets. Errors that escape every local handler used to
 * vanish silently (the app just quietly didn't do the thing); now they log in
 * full and surface one throttled, generic toast so the user knows something
 * went wrong without being buried in duplicates.
 */

const TOAST_THROTTLE_MS = 10_000
let lastToastAt = 0

function notify() {
  const now = Date.now()
  if (now - lastToastAt < TOAST_THROTTLE_MS) return
  lastToastAt = now
  toast('Something went wrong — check the console for details')
}

/** Reload-loop guard for the stale-chunk recovery below. */
const RELOAD_FLAG = 'chunk-reload-attempted'

export function initStabilityNets(): void {
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection', e.reason)
    notify()
  })

  window.addEventListener('error', (e) => {
    // Runtime errors only; resource-load errors don't reach a bubble listener.
    console.error('Uncaught error', e.error ?? e.message)
    notify()
  })

  // A deploy replaces hashed chunk files; a tab that stayed open across it
  // can fail to lazy-load a module that no longer exists. One automatic
  // reload picks up the new version; the sessionStorage flag stops a broken
  // network from looping the reload forever.
  window.addEventListener('vite:preloadError', (e) => {
    if (sessionStorage.getItem(RELOAD_FLAG)) return // let it surface normally
    sessionStorage.setItem(RELOAD_FLAG, '1')
    e.preventDefault()
    window.location.reload()
  })

  // Re-arm only after the app has demonstrably stayed up — clearing at boot
  // would let a persistent failure reload forever.
  setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 30_000)
}
