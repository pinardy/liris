import type { ReactNode } from 'react'

export function Spinner() {
  return (
    <div className="flex justify-center py-12" role="status" aria-label="Loading">
      <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
    </div>
  )
}

export function ErrorMessage({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
      {error.message}
    </div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-medium text-zinc-300">{title}</p>
      {children && <div className="max-w-md text-sm text-zinc-500">{children}</div>}
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
}: {
  loading: boolean
  error?: Error | null
}) {
  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return null
}
