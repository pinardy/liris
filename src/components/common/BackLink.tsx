import { useLocation, useNavigate } from 'react-router'

/**
 * Back control for detail pages, which are only ever reached through a link.
 *
 * Installed to the home screen the app runs in `standalone` display mode with
 * no browser chrome, so without this the only way back is an edge swipe — and
 * the player bar already claims horizontal swipes.
 *
 * React Router stamps the first location of a session with the key 'default',
 * which is how we know whether there is an in-app entry to go back to: a deep
 * link opened cold has none, so it falls back to a named parent instead.
 */
export default function BackLink({
  fallback,
  fallbackLabel,
}: {
  /** Where to go when there's no history — the page's natural parent. */
  fallback: string
  fallbackLabel: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'

  return (
    <button
      type="button"
      onClick={() => void (canGoBack ? navigate(-1) : navigate(fallback))}
      className="-ml-2 mb-3 inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
    >
      <span aria-hidden="true">←</span>
      {canGoBack ? 'Back' : fallbackLabel}
    </button>
  )
}
