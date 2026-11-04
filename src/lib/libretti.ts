import type { Work } from './classical'
import { composerBySlug } from './composers'

/**
 * Where to read what is being sung. Wikisource hosts the public-domain
 * libretti and liturgical texts behind the catalog's vocal works — the words
 * counterpart to IMSLP's scores. As with IMSLP, this links to a SEARCH rather
 * than a guessed page: Wikisource names pages inconsistently ('The Marriage
 * of Figaro' vs 'Le nozze di Figaro', 'Requiem (Mozart)' vs the bare Latin
 * text) and spreads originals and translations across language editions, so
 * a search with the right words lands on or beside the right page where a
 * constructed title would often 404.
 */

export interface SungText {
  /** Button label, e.g. 'Libretto' or 'Latin text'. */
  label: string
  url: string
}

export function wikisourceSearchUrl(query: string): string {
  const params = new URLSearchParams({ search: query, title: 'Special:Search' })
  return `https://en.wikisource.org/w/index.php?${params}`
}

interface Rule {
  /** Matched against the work title. */
  pattern: RegExp
  /** Restrict to one composer where the title alone is ambiguous. */
  composerSlug?: string
  label: string
  query: string
}

/**
 * Checked in order; the first match wins. Liturgical settings share a fixed
 * text regardless of composer, so they get the text's own name rather than
 * the work's. Famous operas are named by their original-language title, which
 * is how Wikisource files them.
 */
const RULES: Rule[] = [
  { pattern: /\brequiem\b/i, label: 'Latin text', query: 'Requiem Mass Latin text' },
  { pattern: /\bstabat mater\b/i, label: 'Latin text', query: 'Stabat Mater dolorosa' },
  { pattern: /\bmagnificat\b/i, label: 'Latin text', query: 'Magnificat anima mea' },
  { pattern: /\bte deum\b/i, label: 'Latin text', query: 'Te Deum laudamus' },
  { pattern: /\b(mass|missa)\b/i, label: 'Latin text', query: 'Ordinary of the Mass Kyrie Gloria Credo' },
  { pattern: /\bmessiah\b/i, label: 'Libretto', query: 'Messiah Handel Jennens libretto' },
  { pattern: /\b(figaro|nozze)\b/i, label: 'Libretto', query: 'Le nozze di Figaro libretto' },
  { pattern: /\bdon giovanni\b/i, label: 'Libretto', query: 'Don Giovanni libretto Da Ponte' },
  { pattern: /\b(magic flute|zauberfl)/i, label: 'Libretto', query: 'Die Zauberflöte libretto' },
  { pattern: /\bcarmen\b/i, label: 'Libretto', query: 'Carmen Bizet libretto' },
  { pattern: /\bdido\b/i, label: 'Libretto', query: 'Dido and Aeneas libretto Tate' },
  {
    // The choral finale; not caught by the vocal form (it reads as a symphony).
    pattern: /\b(symphony no\.?\s*9|choral)\b/i,
    composerSlug: 'beethoven',
    label: 'Ode to Joy text',
    query: 'An die Freude Schiller Ode to Joy',
  },
]

/** Anything else that is sung gets a generic libretto search. */
const SUNG = /\b(opera|aria|cantata|oratorio|chorus|choral|lied|lieder|song|hymn|motet|vespers|ode)\b/i

/** The text link for a work, or undefined for instrumental music. */
export function sungTextFor(work: Work): SungText | undefined {
  const rule = RULES.find(
    (r) =>
      r.pattern.test(work.title) &&
      (!r.composerSlug || r.composerSlug === work.composerSlug),
  )
  if (rule) return { label: rule.label, url: wikisourceSearchUrl(rule.query) }
  if (work.formSlug === 'vocal' || SUNG.test(work.title)) {
    const composer = work.composerSlug
      ? (composerBySlug(work.composerSlug)?.surname ?? work.composerName)
      : work.composerName
    return {
      label: 'Libretto',
      url: wikisourceSearchUrl(`${work.title} ${composer} libretto`),
    }
  }
  return undefined
}
