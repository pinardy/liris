import { useEffect, useRef } from 'react'

/**
 * Dismissal for anything that covers part of the page: modals, sheets,
 * panels and popover menus. While `active`, the overlay
 *
 *  - closes on Escape, but only when it is the TOPMOST overlay. Every open
 *    surface would otherwise react to the same key, so one Escape used to
 *    close a modal AND the queue panel underneath it.
 *  - owns a throwaway history entry, so a mobile back swipe (or the back
 *    button) dismisses it instead of navigating the page underneath. If the
 *    overlay closes any other way while its entry is still on top, the entry
 *    is popped so the history stack stays balanced. The entry carries no
 *    router state, so React Router resolves the pop back to the SAME
 *    location: no page navigation, no scroll restoration.
 *
 * Overlays register in an effect, and effects run in mount order, so the most
 * recently opened one is last on the stack, which is the one a key or gesture
 * is meant for.
 *
 * Pass `active` for overlays driven by internal open state; omit it for
 * components that are only mounted while open.
 */

interface Overlay {
  /** Identifies this overlay's history entry (`history.state.dismissible`). */
  id: number
  close: () => void
}

const stack: Overlay[] = []
let nextId = 1

/** Set just before a programmatic history.back(): that pop is housekeeping,
 *  not a gesture, and must not close the overlay now on top. */
let ignoreNextPop = false

/**
 * A history entry left behind by an overlay that just closed, scheduled to be
 * popped in a macrotask. An overlay opening in the meantime adopts it instead
 * of pushing its own. That covers React StrictMode re-running effects in dev,
 * and a menu handing straight off to a modal (the modal would otherwise push
 * an entry that the menu's pending pop then removes, closing the modal at
 * once).
 */
let orphan: { id: number; cancel: () => void } | null = null

function topmost(): Overlay | undefined {
  return stack[stack.length - 1]
}

if (typeof window !== 'undefined') {
  document.addEventListener(
    'keydown',
    (e) => {
      const top = topmost()
      if (e.key !== 'Escape' || !top) return
      e.stopPropagation()
      e.preventDefault()
      top.close()
    },
    true,
  )
  window.addEventListener('popstate', () => {
    if (ignoreNextPop) {
      ignoreNextPop = false
      return
    }
    topmost()?.close()
  })
}

export function useOverlayDismiss(onClose: () => void, active = true): void {
  // Held in a ref so an inline arrow at the call site never re-runs the effect.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!active) return

    let id: number
    if (orphan) {
      orphan.cancel()
      id = orphan.id
      orphan = null
    } else {
      id = nextId++
      window.history.pushState({ dismissible: id }, '')
    }
    const entry: Overlay = { id, close: () => onCloseRef.current() }
    stack.push(entry)

    return () => {
      stack.splice(stack.indexOf(entry), 1)
      // Closed without a back gesture and no navigation happened since (a
      // Link would have pushed router state over our entry): remove it.
      if (window.history.state?.dismissible !== id) return
      const timer = setTimeout(() => {
        orphan = null
        ignoreNextPop = true
        window.history.back()
      }, 0)
      orphan = { id, cancel: () => clearTimeout(timer) }
    }
  }, [active])
}
