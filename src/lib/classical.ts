import type { ClassicalIndex } from '../services/archive/classicalIndex'
import type { Track } from '../types/model'
import { composerImageUrl, findComposer, type Period } from './composers'

/** Musical forms we can reliably detect from work titles. */
export interface Form {
  slug: string
  label: string
  /** For one work's eyebrow: 'Symphony', not 'Symphonie'. */
  singular: string
  blurb: string
  /** Checked in array order, so put more specific patterns first. */
  pattern: RegExp
}

export const forms: Form[] = [
  {
    slug: 'symphony',
    label: 'Symphonies',
    singular: 'Symphony',
    blurb: 'Large-scale works for full orchestra, usually in several movements.',
    pattern: /\bsymphon/i,
  },
  {
    slug: 'concerto',
    label: 'Concertos',
    singular: 'Concerto',
    blurb: 'A soloist set against the orchestra.',
    pattern: /\bconcerto|brandenburg/i,
  },
  {
    slug: 'chamber',
    label: 'Chamber music',
    singular: 'Chamber music',
    blurb: 'Small ensembles — quartets, trios and quintets.',
    pattern: /\b(quartet|quintet|trio|sextet|octet|chamber)\b/i,
  },
  {
    slug: 'sonata',
    label: 'Sonatas',
    singular: 'Sonata',
    blurb: 'Works for a solo instrument, often with piano.',
    pattern: /\bsonata|partita/i,
  },
  {
    slug: 'keyboard',
    label: 'Keyboard works',
    singular: 'Keyboard work',
    blurb: 'Preludes, fugues, toccatas and variations for keyboard.',
    pattern: /\b(prelude|fugue|toccata|invention|goldberg|well[- ]tempered|clavier)\b/i,
  },
  {
    slug: 'piano-pieces',
    label: 'Piano pieces',
    singular: 'Piano piece',
    blurb: 'Nocturnes, waltzes, études and other character pieces.',
    pattern:
      /\b(nocturne|waltz|valse|etude|étude|ballade|impromptu|mazurka|polonaise|berceuse|barcarolle|rhapsod)\b/i,
  },
  {
    slug: 'variations',
    label: 'Variations',
    singular: 'Variations',
    blurb: 'A theme reworked through successive transformations.',
    pattern: /\bvariation/i,
  },
  {
    slug: 'overture',
    label: 'Overtures',
    singular: 'Overture',
    blurb: 'Concert and operatic curtain-raisers.',
    pattern: /\bovertur|entr'acte/i,
  },
  {
    slug: 'suite',
    label: 'Suites',
    singular: 'Suite',
    blurb: 'Linked sets of shorter movements and dances.',
    pattern: /\bsuite|water music|peer gynt|music for the royal/i,
  },
  {
    slug: 'vocal',
    label: 'Vocal & opera',
    singular: 'Vocal work',
    blurb: 'Opera, mass, cantata and other music with voices.',
    pattern:
      /\b(opera|aria|requiem|mass\b|cantata|oratorio|magnificat|te deum|figaro|flute\b.*magic|magic flute|carmen|messiah)\b/i,
  },
  {
    slug: 'tone-poem',
    label: 'Tone poems',
    singular: 'Tone poem',
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

/**
 * Whether two tracks are movements of the same work. Mirrors how the catalog
 * fills Track: `album` carries the normalized work title and `artist` the
 * composer. Tracks without an album (radio, sparse local files) never group.
 */
export function isSameWork(a: Track, b: Track): boolean {
  return Boolean(a.album) && a.album === b.album && a.artist === b.artist
}

/**
 * The contiguous run of queue tracks belonging to the track at `index` —
 * this performance's movements, in order — as [start, end). A track with no
 * work (radio, sparse local files) is a run of one.
 */
export function workSlice(queue: Track[], index: number): { start: number; end: number } {
  const current = queue[index]
  if (!current?.album) return { start: index, end: index + 1 }
  let start = index
  while (start > 0 && isSameWork(queue[start - 1], current)) start--
  let end = index + 1
  while (end < queue.length && isSameWork(queue[end], current)) end++
  return { start, end }
}

/** Where the track at `index` sits in its work (2 of 4), or undefined when
 *  the work around it has a single movement. */
export function movementPosition(
  queue: Track[],
  index: number,
): { n: number; total: number } | undefined {
  const { start, end } = workSlice(queue, index)
  return end - start > 1 ? { n: index - start + 1, total: end - start } : undefined
}

export function workDuration(work: Work): number {
  return work.recordings[0]?.durationSec ?? 0
}

/**
 * Artwork for a work: the composer's portrait where one is curated. The
 * collection thumbnail is one logo shared by every work in that edition, so
 * a grid of works would otherwise be a grid of identical logos.
 */
export function workArtwork(work: Work): string | undefined {
  const portrait = work.composerSlug && composerImageUrl(work.composerSlug, 400)
  return portrait || work.recordings[0]?.artworkUrl
}

/** Artwork for a track, by the same rule: catalog recordings show their
 *  composer; everything else (imported files, Jamendo, radio) its own art.
 *  Used for lists, the player and the lock screen alike. */
export function trackArtworkUrl(track: Track): string | undefined {
  if (track.source === 'archive') {
    const composer = findComposer(track.artist)
    const portrait = composer && composerImageUrl(composer.slug, 512)
    if (portrait) return portrait
  }
  return track.artworkUrl
}

/**
 * What to listen to next from a work's page: more by the same composer,
 * then more of the same form by others. Works are already in catalog order
 * (multi-movement first), so the first few are good entry points.
 */
export function relatedWorks(
  index: Pick<ClassicalIndex, 'works'>,
  work: Work,
  limit = 4,
): { byComposer: Work[]; byForm: Work[] } {
  const sameComposer = (w: Work) =>
    work.composerSlug ? w.composerSlug === work.composerSlug : w.composerName === work.composerName
  const others = index.works.filter((w) => w.id !== work.id)
  return {
    byComposer: others.filter(sameComposer).slice(0, limit),
    byForm: work.formSlug
      ? others.filter((w) => w.formSlug === work.formSlug && !sameComposer(w)).slice(0, limit)
      : [],
  }
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
