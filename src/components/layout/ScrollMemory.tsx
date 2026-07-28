import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/** Scroll offsets per history entry, for the lifetime of the session. */
const positions = new Map<string, number>()

/**
 * Scroll restoration for the app's scroll container. The browser can't help
 * here — scrolling happens on <main>, not the window — so this restores the
 * saved offset on back/forward navigation and starts new pages at the top.
 *
 * The outgoing position is captured in the RENDER phase, at the moment the
 * location key changes: the old page's DOM is still mounted then, so its
 * offset is intact. Any later (a scroll listener, an effect cleanup) is too
 * late — committing a shorter page clamps scrollTop and fires a scroll event
 * before any effect runs, silently overwriting the real position with 0.
 */
export default function ScrollMemory({
  container,
}: {
  container: RefObject<HTMLElement | null>
}) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const prevKey = useRef(location.key)

  if (prevKey.current !== location.key) {
    const el = container.current
    if (el) positions.set(prevKey.current, el.scrollTop)
    prevKey.current = location.key
  }

  useLayoutEffect(() => {
    const el = container.current
    if (!el) return
    el.scrollTop = navigationType === 'POP' ? (positions.get(location.key) ?? 0) : 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  return null
}
