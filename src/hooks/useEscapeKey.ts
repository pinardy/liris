import { useEffect, useRef } from 'react'
import { isTopmostOverlay, registerOverlay } from './overlayStack'

/**
 * Escape closes it. For small popovers (speed, sleep timer, equalizer) that
 * want the key but not the rest of the dialog treatment — no focus move, no
 * trap, since the trigger stays right there behind them.
 */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape
  // Stable identity for this popover's place in the overlay stack.
  const token = useRef({})

  useEffect(() => {
    if (!active) return
    const self = token.current
    const unregister = registerOverlay(self)
    function onKeyDown(e: KeyboardEvent) {
      // Only the topmost overlay reacts — see overlayStack.
      if (e.key !== 'Escape' || !isTopmostOverlay(self)) return
      e.stopPropagation()
      onEscapeRef.current()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      unregister()
    }
  }, [active])
}
