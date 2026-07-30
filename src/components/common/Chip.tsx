import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** The rounded pill used for the browse-by chips (forms, instruments, …). */
export const chipClass =
  'rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700'

export interface ChipItem {
  key: string
  to: string
  label: ReactNode
  title?: string
}

/**
 * A titled section of pill links — the repeated "heading + wrapping row of
 * chips" block on the home page (forms, instruments, performers).
 */
export default function ChipSection({
  title,
  items,
}: {
  title: string
  items: ChipItem[]
}) {
  if (items.length === 0) return null
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item.key} to={item.to} title={item.title} className={chipClass}>
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
