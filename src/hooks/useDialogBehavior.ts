import { useEffect, useRef, type RefObject } from 'react'
import { isTopmostOverlay, registerOverlay } from './overlayStack'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * The keyboard half of a modal surface: Escape closes it, Tab stays inside it,
 * focus moves in on open and returns to the trigger on close.
 *
 * Overlays here are plain elements rather than <dialog>, so none of this comes
 * for free. Apply it to anything that visually covers the page (modals, the
 * now-playing sheet, the queue panel) and give that element tabIndex={-1} so
 * there is always somewhere to put focus.
 */
export function useDialogBehavior(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  /** Set false for a panel that deliberately leaves the page usable beneath
   *  it (the queue, where the transport must stay reachable): Escape and
   *  focus-in still apply, but Tab is free to leave. */
  { trap = true }: { trap?: boolean } = {},
): void {
  // Held in a ref so an inline arrow at the call site can't re-run the effect
  // and yank focus back to the top of the dialog on every render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Captured during the first render, before the dialog is committed — by the
  // time an effect runs, React's autoFocus may already have moved focus into
  // the dialog, and restoring to a node inside it would restore nothing.
  const previouslyFocused = useRef<HTMLElement | null>(null)
  if (previouslyFocused.current === null) {
    previouslyFocused.current = document.activeElement as HTMLElement | null
  }

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const unregister = registerOverlay(node)

    const focusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      )

    // Only pull focus in if it isn't already there: a field marked autoFocus
    // (the rename and new-playlist inputs) has claimed it during commit, and
    // dragging focus back to the close button would undo that.
    if (!node.contains(document.activeElement)) {
      ;(focusable()[0] ?? node).focus()
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Only the topmost overlay closes: sibling capture listeners on
        // document all run regardless of stopPropagation, so without this
        // check one Escape would close this dialog and everything under it.
        if (!node || !isTopmostOverlay(node)) return
        e.stopPropagation()
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !trap) return
      const items = focusable()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === firstItem || active === node)) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      unregister()
      // Skip if the trigger has since left the DOM (a dialog that deleted the
      // row that opened it), where focusing it would do nothing useful.
      const trigger = previouslyFocused.current
      if (trigger?.isConnected) trigger.focus()
    }
  }, [ref, trap])
}
