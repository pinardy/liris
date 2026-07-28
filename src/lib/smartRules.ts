import type { SmartRules } from '../types/model'
import type { ClassicalIndex } from '../services/archive/classicalIndex'
import { formBySlug, workDuration, type Work } from './classical'
import { composerBySlug, periods } from './composers'
import { detectInstruments, instrumentBySlug } from './performers'

/** Works matching the rules. Fields AND together; values within a field OR. */
export function evaluateSmartRules(rules: SmartRules, index: ClassicalIndex): Work[] {
  return index.works.filter(
    (w) =>
      (!rules.periods?.length || (w.period !== undefined && rules.periods.includes(w.period))) &&
      (!rules.formSlugs?.length ||
        (w.formSlug !== undefined && rules.formSlugs.includes(w.formSlug))) &&
      (!rules.composerSlugs?.length ||
        (w.composerSlug !== undefined && rules.composerSlugs.includes(w.composerSlug))) &&
      (!rules.instruments?.length ||
        detectInstruments(w.title).some((i) => rules.instruments!.includes(i))) &&
      (!rules.maxWorkMinutes || workDuration(w) <= rules.maxWorkMinutes * 60),
  )
}

/** Human-readable rule summary, e.g. 'Baroque · Concertos · under 15 min'. */
export function describeSmartRules(rules: SmartRules): string {
  const parts: string[] = []
  if (rules.composerSlugs?.length) {
    parts.push(
      rules.composerSlugs
        .map((slug) => composerBySlug(slug)?.surname ?? slug)
        .join(', '),
    )
  }
  if (rules.periods?.length) {
    // Keep the canonical era order rather than click order.
    parts.push(
      periods
        .filter((p) => rules.periods!.includes(p.name))
        .map((p) => p.name)
        .join(', '),
    )
  }
  if (rules.formSlugs?.length) {
    parts.push(rules.formSlugs.map((slug) => formBySlug(slug)?.label ?? slug).join(', '))
  }
  if (rules.instruments?.length) {
    parts.push(
      rules.instruments.map((slug) => instrumentBySlug(slug)?.label ?? slug).join(', '),
    )
  }
  if (rules.maxWorkMinutes) parts.push(`under ${rules.maxWorkMinutes} min`)
  return parts.length > 0 ? parts.join(' · ') : 'All works'
}
