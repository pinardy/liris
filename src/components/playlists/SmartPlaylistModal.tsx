import { useState } from 'react'
import { useClassicalIndex } from '../../hooks/useClassicalIndex'
import { forms } from '../../lib/classical'
import { composers, periods } from '../../lib/composers'
import { instruments } from '../../lib/performers'
import { evaluateSmartRules } from '../../lib/smartRules'
import type { SmartPlaylist, SmartRules } from '../../types/model'
import Modal from '../common/Modal'

const MAX_OPTIONS = [10, 15, 20, 30, 45] as const

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        selected
          ? 'bg-accent text-black'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      }`}
    >
      {label}
    </button>
  )
}

/** Create or edit a smart playlist's rules, with a live match count. */
export default function SmartPlaylistModal({
  existing,
  onSave,
  onClose,
}: {
  existing?: SmartPlaylist
  onSave: (name: string, rules: SmartRules) => void
  onClose: () => void
}) {
  const { data: index } = useClassicalIndex()
  const [name, setName] = useState(existing?.name ?? '')
  const [periodNames, setPeriodNames] = useState<string[]>(existing?.rules.periods ?? [])
  const [formSlugs, setFormSlugs] = useState<string[]>(existing?.rules.formSlugs ?? [])
  const [instrumentSlugs, setInstrumentSlugs] = useState<string[]>(
    existing?.rules.instruments ?? [],
  )
  const [composerSlug, setComposerSlug] = useState(
    existing?.rules.composerSlugs?.[0] ?? '',
  )
  const [maxMinutes, setMaxMinutes] = useState(existing?.rules.maxWorkMinutes ?? 0)

  const rules: SmartRules = {
    periods: periodNames.length > 0 ? periodNames : undefined,
    formSlugs: formSlugs.length > 0 ? formSlugs : undefined,
    instruments: instrumentSlugs.length > 0 ? instrumentSlugs : undefined,
    composerSlugs: composerSlug ? [composerSlug] : undefined,
    maxWorkMinutes: maxMinutes || undefined,
  }
  const matchCount = index ? evaluateSmartRules(rules, index).length : null

  const sectionLabel = 'mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400'

  return (
    <Modal
      title={existing ? 'Edit smart playlist' : 'New smart playlist'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          onSave(name.trim(), rules)
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name — e.g. Short Baroque concertos"
          autoFocus
          className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
        />

        <p className={sectionLabel}>Period</p>
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <Chip
              key={p.slug}
              label={p.name}
              selected={periodNames.includes(p.name)}
              onToggle={() => setPeriodNames((v) => toggle(v, p.name))}
            />
          ))}
        </div>

        <p className={sectionLabel}>Form</p>
        <div className="flex flex-wrap gap-1.5">
          {forms.map((f) => (
            <Chip
              key={f.slug}
              label={f.label}
              selected={formSlugs.includes(f.slug)}
              onToggle={() => setFormSlugs((v) => toggle(v, f.slug))}
            />
          ))}
        </div>

        <p className={sectionLabel}>Instrument</p>
        <div className="flex flex-wrap gap-1.5">
          {instruments.map((i) => (
            <Chip
              key={i.slug}
              label={i.label}
              selected={instrumentSlugs.includes(i.slug)}
              onToggle={() => setInstrumentSlugs((v) => toggle(v, i.slug))}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={composerSlug}
            onChange={(e) => setComposerSlug(e.target.value)}
            aria-label="Composer"
            className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="">Any composer</option>
            {composers.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={maxMinutes || ''}
            onChange={(e) => setMaxMinutes(Number(e.target.value) || 0)}
            aria-label="Maximum work length"
            className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="">Any length</option>
            {MAX_OPTIONS.map((min) => (
              <option key={min} value={min}>
                Under {min} min
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">
            {matchCount !== null &&
              `${matchCount} work${matchCount === 1 ? '' : 's'} match`}
          </span>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-md bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            {existing ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
