import type { Track } from '../types/model'
import { findComposer, type Period } from './composers'

/** Musical forms we can reliably detect from work titles. */
export interface Form {
  slug: string
  label: string
  blurb: string
  /** Checked in array order, so put more specific patterns first. */
  pattern: RegExp
}

export const forms: Form[] = [
  {
    slug: 'symphony',
    label: 'Symphonies',
    blurb: 'Large-scale works for full orchestra, usually in several movements.',
    pattern: /\bsymphon/i,
  },
  {
    slug: 'concerto',
    label: 'Concertos',
    blurb: 'A soloist set against the orchestra.',
    pattern: /\bconcerto|brandenburg/i,
  },
  {
    slug: 'chamber',
    label: 'Chamber music',
    blurb: 'Small ensembles — quartets, trios and quintets.',
    pattern: /\b(quartet|quintet|trio|sextet|octet|chamber)\b/i,
  },
  {
    slug: 'sonata',
    label: 'Sonatas',
    blurb: 'Works for a solo instrument, often with piano.',
    pattern: /\bsonata|partita/i,
  },
  {
    slug: 'keyboard',
    label: 'Keyboard works',
    blurb: 'Preludes, fugues, toccatas and variations for keyboard.',
    pattern: /\b(prelude|fugue|toccata|invention|goldberg|well[- ]tempered|clavier)\b/i,
  },
  {
    slug: 'piano-pieces',
    label: 'Piano pieces',
    blurb: 'Nocturnes, waltzes, études and other character pieces.',
    pattern:
      /\b(nocturne|waltz|valse|etude|étude|ballade|impromptu|mazurka|polonaise|berceuse|barcarolle|rhapsod)\b/i,
  },
  {
    slug: 'variations',
    label: 'Variations',
    blurb: 'A theme reworked through successive transformations.',
    pattern: /\bvariation/i,
  },
  {
    slug: 'overture',
    label: 'Overtures',
    blurb: 'Concert and operatic curtain-raisers.',
    pattern: /\bovertur|entr'acte/i,
  },
  {
    slug: 'suite',
    label: 'Suites',
    blurb: 'Linked sets of shorter movements and dances.',
    pattern: /\bsuite|water music|peer gynt|music for the royal/i,
  },
  {
    slug: 'vocal',
    label: 'Vocal & opera',
    blurb: 'Opera, mass, cantata and other music with voices.',
    pattern:
      /\b(opera|aria|requiem|mass\b|cantata|oratorio|magnificat|te deum|figaro|flute\b.*magic|magic flute|carmen|messiah)\b/i,
  },
  {
    slug: 'tone-poem',
    label: 'Tone poems',
    blurb: 'Single-movement orchestral works that tell a story.',
    pattern:
      /\b(poem|vltava|moldau|steppes|danse macabre|pictures at|finlandia|meditation|romance)\b/i,
  },
]

export function detectForm(workTitle: string): Form | undefined {
  return forms.find((f) => f.pattern.test(workTitle))
}

export function formBySlug(slug: string): Form | undefined {
  return forms.find((f) => f.slug === slug)
}

const CATALOGUE = /\b(Op\.?\s?\d+[a-z]?|BWV\.?\s?\d+|KV?\.?\s?\d{2,3}|D\.?\s?\d{3}|Hob\.?\s?[IVXL]+:\s?\d+)\b/i

/** Pull an opus / catalogue number out of a work title, e.g. 'Op. 55', 'BWV 988'. */
export function detectCatalogue(workTitle: string): string | undefined {
  const m = CATALOGUE.exec(workTitle)
  if (!m) return undefined
  return m[1].replace(/\.\s?/, '. ').replace(/\s+/g, ' ').trim()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** One performance of a work: its movements, plus who played them. */
export interface Recording {
  id: string
  collectionId: string
  collectionName: string
  license: string
  /** Conductors, orchestras and soloists credited on this performance. */
  performers: string[]
  /** Movements, in performance order. */
  tracks: Track[]
  durationSec: number
  artworkUrl?: string
}

/**
 * A musical work — the thing a listener actually chooses — separate from the
 * recordings of it. Modelling works apart from performances is what makes a
 * classical catalog navigable rather than an undifferentiated track list.
 */
export interface Work {
  id: string
  title: string
  composerName: string
  composerSlug?: string
  period?: Period
  catalogue?: string
  formSlug?: string
  /** Ordered best-first; most works here have exactly one. */
  recordings: Recording[]
}

/** Every track of a work's preferred recording. */
export function workTracks(work: Work): Track[] {
  return work.recordings[0]?.tracks ?? []
}

/**
 * Reconstruct the catalog work id for a playing archive track, so the player
 * can link to the work page without loading the whole index. Mirrors the id
 * scheme in classicalIndex (`composerSlug--workSlug`; track.album carries the
 * normalized work title). A miss just lands on WorkPage's not-found state.
 */
export function workIdForTrack(track: Track): string | undefined {
  if (track.source !== 'archive' || !track.album) return undefined
  const composer = findComposer(track.artist)
  return `${composer?.slug ?? slugify(track.artist)}--${slugify(track.album)}`
}

export function workDuration(work: Work): number {
  return work.recordings[0]?.durationSec ?? 0
}

export function workArtwork(work: Work): string | undefined {
  return work.recordings[0]?.artworkUrl
}

export function workPerformers(work: Work): string[] {
  return work.recordings[0]?.performers ?? []
}

/** Typos present in the source catalog metadata. */
const TITLE_FIXES: [RegExp, string][] = [
  [/\bSymphon\b/g, 'Symphony'],
  [/\bSpirtis\b/g, 'Spirits'],
  [/\bin\s?B Minor\b/g, 'in B Minor'],
]

/** Strip a trailing movement marker so movements of one work group together. */
export function normalizeWorkTitle(title: string): string {
  let out = title
    .replace(
      /\s*[-–—:]\s*(\d+\s*(st|nd|rd|th)?\s*)?(mov(ement|t)?\.?|var(iatio|iation)?\.?)\s*\d*\s*$/i,
      '',
    )
    .replace(/\s*\(.*(movement|mvt).*\)\s*$/i, '')
  for (const [pattern, replacement] of TITLE_FIXES) out = out.replace(pattern, replacement)
  return out.replace(/\s+/g, ' ').trim()
}
