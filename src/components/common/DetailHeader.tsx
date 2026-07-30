import type { ReactNode } from 'react'

/**
 * The shared header for detail pages (work, composer, collection, playlists):
 * a large artwork/avatar/icon tile beside an uppercase eyebrow, a big title,
 * and a stack of metadata + action rows passed as `children`.
 */
export default function DetailHeader({
  artwork,
  eyebrow,
  title,
  titleClassName = 'md:text-4xl',
  children,
}: {
  artwork: ReactNode
  eyebrow: ReactNode
  title: ReactNode
  /** Override the responsive title size (composers run larger). */
  titleClassName?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
      {artwork}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {eyebrow}
        </p>
        <h1 className={`mt-1 break-words text-3xl font-extrabold ${titleClassName}`}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
