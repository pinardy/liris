import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import type { WikiSummary } from '../../services/wikipedia'

interface Props {
  /** Loads the summary; only re-invoked when `cacheKey` changes. */
  load: () => Promise<WikiSummary | null>
  cacheKey: string
}

/**
 * A short encyclopedia introduction with attribution. Renders nothing while
 * loading and nothing at all when no trustworthy article was found — an
 * absent blurb is better than a wrong one.
 */
export default function AboutBlurb({ load, cacheKey }: Props) {
  const { data } = useAsync(load, [cacheKey], true, cacheKey)
  const [expanded, setExpanded] = useState(false)

  if (!data) return null

  // Only offer "More" when there's plausibly something hidden to reveal.
  const clampable = data.extract.length > 280

  return (
    <section className="mb-8 max-w-3xl">
      <p
        className={`text-sm leading-relaxed text-zinc-300 ${
          clampable && !expanded ? 'line-clamp-3' : ''
        }`}
      >
        {data.extract}
      </p>
      <p className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
        {clampable && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="font-semibold text-zinc-300 hover:text-white"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        )}
        {data.url ? (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white hover:underline"
          >
            From Wikipedia →
          </a>
        ) : (
          <span>From Wikipedia</span>
        )}
      </p>
    </section>
  )
}
