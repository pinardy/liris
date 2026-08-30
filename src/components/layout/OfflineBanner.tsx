import { Link } from 'react-router'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

/**
 * Standing notice while the network is gone. The app is built to work offline,
 * so this says what still works rather than presenting it as a failure — and
 * points at the downloads that do play.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div
      role="status"
      className="px-4-safe flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-t border-amber-900/60 bg-amber-950/90 py-1.5 text-center text-xs text-amber-200"
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber-400" />
      You're offline — downloads and your imported library still play.
      <Link
        to="/downloads"
        className="font-medium underline underline-offset-2 hover:text-white"
      >
        See downloads
      </Link>
    </div>
  )
}
