import { useEffect, useRef, useState } from 'react'

/**
 * Offers the new version instead of taking it silently.
 *
 * The service worker used to `skipWaiting` on every deploy, so an open tab
 * could be swapped under the listener mid-movement with no explanation. Now
 * the worker waits, and the reload happens when the listener says so — which
 * matters here more than in most apps, because reloading stops the music.
 */
export default function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    let cancelled = false
    void import('virtual:pwa-register')
      .then(({ registerSW }) => {
        if (cancelled) return
        updateRef.current = registerSW({
          immediate: true,
          onNeedRefresh: () => setNeedRefresh(true),
        })
      })
      .catch(() => {
        // No service worker (dev, or an unsupported browser) — nothing to do.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="px-4-safe flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-accent/40 bg-accent/15 py-1.5 text-center text-xs text-accent"
    >
      A new version of Liris is ready.
      <button
        type="button"
        onClick={() => void updateRef.current?.(true)}
        className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-black hover:bg-accent-hover"
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="text-zinc-400 underline underline-offset-2 hover:text-white"
      >
        Later
      </button>
    </div>
  )
}
