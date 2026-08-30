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
    if (navigationType !== 'POP') {
      el.scrollTop = 0
      return
    }
    const target = positions.get(location.key) ?? 0
    el.scrollTop = target
    if (target === 0) return

    // Dexie-backed pages (library, favorites, downloads, history…) render
    // empty on the first pass, so the container is far too short to hold the
    // restored offset and the assignment above clamps to 0. Keep re-applying
    // it as rows arrive and the page grows, then stop — either once the
    // offset sticks, or as soon as the user scrolls for themselves.
    //
    // A MutationObserver, not a ResizeObserver: the container is a flex child
    // sized by the viewport, so its own box never changes when children are
    // appended — only scrollHeight grows, which a ResizeObserver can't see.
    let settled = false
    const observer = new MutationObserver(() => {
      if (settled || el.scrollTop === target) return
      if (el.scrollHeight - el.clientHeight >= target) {
        el.scrollTop = target
        settled = true
      }
    })
    observer.observe(el, { childList: true, subtree: true })
    const onManualScroll = () => {
      settled = true
    }
    // A wheel/touch scroll means the reader has taken over; never fight it.
    el.addEventListener('wheel', onManualScroll, { passive: true, once: true })
    el.addEventListener('touchmove', onManualScroll, { passive: true, once: true })
    const stop = setTimeout(() => observer.disconnect(), 3000)
    return () => {
      clearTimeout(stop)
      observer.disconnect()
      el.removeEventListener('wheel', onManualScroll)
      el.removeEventListener('touchmove', onManualScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  return null
}
