import { useState } from 'react'
import { findTerms } from '../../lib/musicalTerms'

/**
 * Glossary chips for the musical terms found in a work's movement titles.
 * Tap a term to read its one-line definition. Renders nothing when the
 * titles contain no known terms.
 */
export default function TermChips({ texts }: { texts: string[] }) {
  const [openTerm, setOpenTerm] = useState<string | null>(null)
  const terms = findTerms(texts)
  if (terms.length === 0) return null

  const open = terms.find((t) => t.term === openTerm)

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        In this work
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {terms.map((t) => (
          <button
            key={t.term}
            type="button"
            onClick={() => setOpenTerm(openTerm === t.term ? null : t.term)}
            aria-expanded={openTerm === t.term}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              openTerm === t.term
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {t.term}
          </button>
        ))}
      </div>
      {open && (
        <p className="mt-3 max-w-xl rounded-lg bg-zinc-900/70 p-3 text-sm text-zinc-300">
          <span className="font-semibold capitalize text-white">{open.term}</span>
          <span className="text-zinc-500"> · </span>
          {open.definition}
        </p>
      )}
    </section>
  )
}
