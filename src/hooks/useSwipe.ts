import { useRef, type TouchEvent } from 'react'

interface Handlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
}

export type SwipeDirection = 'left' | 'right' | 'up' | null

export interface TouchPoint {
  x: number
  y: number
  t: number
}

/** Minimum travel before a touch counts as a swipe rather than a tap. */
const THRESHOLD_PX = 45
/** Beyond this, the gesture was a scroll or a drag, not a flick. */
const MAX_DURATION_MS = 800
/** How much one axis must dominate for the gesture to count on that axis. */
const AXIS_RATIO = 2

/**
 * Classify a touch as a swipe direction, or null when it's a tap, a slow
 * drag, or too diagonal to be sure. Pure, so the thresholds can be tested
 * without a DOM.
 */
export function classifySwipe(from: TouchPoint, to: TouchPoint): SwipeDirection {
  if (to.t - from.t > MAX_DURATION_MS) return null
  const dx = to.x - from.x
  const dy = to.y - from.y
  const absX = Math.abs(dx)
  const absY = Math.abs(dy)

  if (absX > absY * AXIS_RATIO && absX > THRESHOLD_PX) {
    // Swiping left moves forward, matching the direction cards travel.
    return dx < 0 ? 'left' : 'right'
  }
  // Downward is deliberately unhandled: it belongs to page scroll.
  if (absY > absX * AXIS_RATIO && -dy > THRESHOLD_PX) return 'up'
  return null
}

/**
 * Touch swipe detection for a single element; spread the result onto it.
 *
 * Deliberately passive — the handlers never call preventDefault, so vertical
 * page scrolling is untouched.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp }: Handlers) {
  const start = useRef<TouchPoint | null>(null)

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0]
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() }
    },
    onTouchEnd: (e: TouchEvent) => {
      const from = start.current
      start.current = null
      if (!from) return
      const t = e.changedTouches[0]
      const direction = classifySwipe(from, { x: t.clientX, y: t.clientY, t: Date.now() })
      if (direction === 'left') onSwipeLeft?.()
      else if (direction === 'right') onSwipeRight?.()
      else if (direction === 'up') onSwipeUp?.()
    },
  }
}
