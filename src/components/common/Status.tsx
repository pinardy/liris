import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buttonClass } from './buttonStyles'

export function Spinner() {
  return (
    <div className="flex justify-center py-12" role="status" aria-label="Loading">
      <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
    </div>
  )
}

/** A way out of a dead end: either a route or a handler, never both. */
export interface StatusAction {
  label: string
  to?: string
  onClick?: () => void
}

function ActionButton({ action }: { action: StatusAction }) {
  if (action.to) {
    return (
      <Link to={action.to} className={buttonClass('outline', 'sm')}>
        {action.label}
      </Link>
    )
  }
  return (
    <button type="button" onClick={action.onClick} className={buttonClass('outline', 'sm')}>
      {action.label}
    </button>
  )
}

/**
 * Failure state for a page section. `error.message` is developer text (“HTTP
 * 404”, “Track has no stream URL”), so it's shown as a secondary detail under
 * a sentence the reader can act on — with Retry whenever the caller can retry.
 */
export function ErrorMessage({
  error,
  onRetry,
  title = "That didn't load",
}: {
  error: Error
  onRetry?: () => void
  title?: string
}) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm">
      <p className="font-medium text-red-200">{title}</p>
      <p className="mt-1 text-red-300/80">
        {navigator.onLine === false
          ? "You're offline — reconnect and try again."
          : 'The source may be temporarily unavailable.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={buttonClass('subtle', 'sm', 'mt-3')}
        >
          Try again
        </button>
      )}
      <p className="mt-3 text-xs text-red-300/60">{error.message}</p>
    </div>
  )
}

export function EmptyState({
  title,
  action,
  children,
}: {
  title: string
  /** Empty states that describe an action should also offer it. */
  action?: StatusAction
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-medium text-zinc-300">{title}</p>
      {children && <div className="max-w-md text-sm text-zinc-400">{children}</div>}
      {action && (
        <div className="mt-4">
          <ActionButton action={action} />
        </div>
      )}
    </div>
  )
}

/**
 * The loading/error gate for fully-gated pages: a spinner while loading, then
 * the error if one occurred. Call it once at the top so every such page treats
 * the two states the same way and in the same order:
 *   if (loading || error) return <AsyncGate loading={loading} error={error} />
 */
export function AsyncGate({
  loading,
  error,
  onRetry,
}: {
  loading: boolean
  error?: Error | null
  onRetry?: () => void
}) {
  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} onRetry={onRetry} />
  return null
}
