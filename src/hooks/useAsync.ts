import { useEffect, useState } from 'react'

interface AsyncState<T> {
  data?: T
  error?: Error
  loading: boolean
}

/** Session-scoped result cache so back-navigation renders instantly. */
const memCache = new Map<string, unknown>()
const MAX_CACHE_ENTRIES = 50

/**
 * Minimal fetch-state hook. `deps` control when the fetcher re-runs.
 * Pass `enabled: false` to hold off (e.g. empty search query).
 * With a `cacheKey`, a successful result is kept for the session and reused
 * on remount without a loading state (catalog data barely changes; the
 * service worker's StaleWhileRevalidate keeps it fresh across sessions).
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
  cacheKey?: string,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>(() =>
    cacheKey !== undefined && memCache.has(cacheKey)
      ? { data: memCache.get(cacheKey) as T, loading: false }
      : { loading: enabled },
  )

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false })
      return
    }
    if (cacheKey !== undefined && memCache.has(cacheKey)) {
      setState({ data: memCache.get(cacheKey) as T, loading: false })
      return
    }
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: undefined }))
    fetcher()
      .then((data) => {
        if (cacheKey !== undefined) {
          if (memCache.size >= MAX_CACHE_ENTRIES) {
            const oldest = memCache.keys().next().value
            if (oldest !== undefined) memCache.delete(oldest)
          }
          memCache.set(cacheKey, data)
        }
        if (!cancelled) setState({ data, loading: false })
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setState({
            error: error instanceof Error ? error : new Error(String(error)),
            loading: false,
          })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, cacheKey])

  return state
}
