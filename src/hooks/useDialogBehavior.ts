import { useEffect, useRef, type RefObject } from 'react'
import { useOverlayDismiss } from './useOverlayDismiss'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Everything a modal surface needs that a plain element lacks: Escape and a
 * mobile back swipe close it (useOverlayDismiss), Tab stays inside it, focus
 * moves in on open and returns to the trigger on close.
 *
 * Apply it to anything that visually covers the page (modals, the now-playing
 * sheet, the queue panel) and give that element tabIndex={-1} so there is
 * always somewhere to put focus. The component must only be mounted while
 * open: the trigger to restore focus to is captured on first render.
 */
export function useDialogBehavior(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  /** Set false for a panel that deliberately leaves the page usable beneath
   *  it (the queue, where the transport must stay reachable): Escape and
   *  focus-in still apply, but Tab is free to leave. */
  { trap = true }: { trap?: boolean } = {},
): void {
  useOverlayDismiss(onClose)

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
      // Skip if the trigger has since left the DOM (a dialog that deleted the
      // row that opened it), where focusing it would do nothing useful.
      const trigger = previouslyFocused.current
      if (trigger?.isConnected) trigger.focus()
    }
  }, [ref, trap])
}
