import type { ReactNode } from 'react'

export default function PageHeading({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      {children}
    </div>
  )
}
