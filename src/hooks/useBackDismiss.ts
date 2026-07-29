import { useEffect, useRef } from 'react'

/**
 * Ties an open overlay (full-screen sheet, panel, modal, menu) to a browser
 * history entry so a mobile back swipe (or the back button) dismisses it
 * instead of navigating the page underneath.
 *
 * While `active`, a throwaway history entry is pushed; `popstate` (the back
 * gesture) triggers `onClose`. If the overlay closes any other way (X button,
 * backdrop tap) while our entry is still on top, cleanup pops it so the
 * history stack stays balanced. The entry carries no router state, so React
 * Router resolves the pop back to the SAME location — no page navigation and
 * no scroll restoration fires.
 *
 * Pass `active` for overlays driven by internal open state; omit it for
 * components that are only mounted while open.
 */
export function useBackDismiss(onClose: () => void, active = true) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Cleanup schedules its history.back() in a macrotask so an immediate
  // re-run of the effect (React StrictMode re-invokes effects in dev) can
  // cancel it and adopt the still-present entry. Without this, the pending
  // pop lands after the re-push and instantly dismisses the overlay.
  const cancelPendingBack = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!active) return

    if (cancelPendingBack.current) {
      cancelPendingBack.current()
      cancelPendingBack.current = null
    } else {
      window.history.pushState({ dismissible: true }, '')
    }

    const handlePop = () => onCloseRef.current()
    window.addEventListener('popstate', handlePop)

    return () => {
      window.removeEventListener('popstate', handlePop)
      // Closed without a back gesture and no navigation happened since
      // (a Link would have pushed router state over our entry) — remove it.
      if (window.history.state?.dismissible) {
        const timer = setTimeout(() => {
          cancelPendingBack.current = null
          window.history.back()
        }, 0)
        cancelPendingBack.current = () => clearTimeout(timer)
      }
    }
  }, [active])
}
