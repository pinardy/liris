/**
 * Performer roles and instruments, inferred heuristically. Archive.org
 * credits are bare name strings ('Musopen Symphony', 'Kimiko Ishizaka'), so
 * ensembles are recognised by the words in their names, and instruments come
 * from work titles ('Piano Concerto No. 21') — the one place the source data
 * states instrumentation reliably.
 */

export type PerformerRole = 'orchestra' | 'ensemble' | 'choir' | 'artist'

const ROLE_PATTERNS: [PerformerRole, RegExp][] = [
  // Checked in order: 'Symphony Chorus' should read as a choir, not an orchestra.
  ['choir', /\b(choir|chorus|chorale|singers|schola|cantorum)\b/i],
  ['orchestra', /\b(orchestr[a-z]*|philharmoni[a-z]*|symphony|sinfoni[a-z]*|band)\b/i],
  [
    'ensemble',
    /\b(quartet|quintet|trio|sextet|octet|ensemble|consort|academy|camerata|players|soloists|musici)\b/i,
  ],
]

export function classifyPerformer(name: string): PerformerRole {
  for (const [role, pattern] of ROLE_PATTERNS) {
    if (pattern.test(name)) return role
  }
  return 'artist'
}

export const roleLabels: Record<PerformerRole, string> = {
  orchestra: 'Orchestra',
  ensemble: 'Ensemble',
  choir: 'Choir',
  artist: 'Performer',
}

export interface Instrument {
  slug: string
  label: string
  blurb: string
  /** Matched against work titles. */
  pattern: RegExp
}

export const instruments: Instrument[] = [
  {
    slug: 'piano',
    label: 'Piano',
    blurb: 'Concertos, sonatas and character pieces for the piano.',
    pattern: /\b(piano|pianoforte|klavier)\b/i,
  },
  {
    slug: 'violin',
    label: 'Violin',
    blurb: 'The violin as soloist and protagonist.',
    pattern: /\bviolin\b/i,
  },
  {
    slug: 'cello',
    label: 'Cello',
    blurb: 'Works led by the cello.',
    pattern: /\b(cello|violoncello)\b/i,
  },
  {
    slug: 'flute',
    label: 'Flute',
    blurb: 'Works for flute.',
    pattern: /\bflute\b/i,
  },
  {
    slug: 'oboe',
    label: 'Oboe',
    blurb: 'Works for oboe.',
    pattern: /\boboe\b/i,
  },
  {
    slug: 'clarinet',
    label: 'Clarinet',
    blurb: 'Works for clarinet.',
    pattern: /\bclarinet\b/i,
  },
  {
    slug: 'horn',
    label: 'Horn',
    blurb: 'Works for horn.',
    pattern: /\b(french )?horn\b/i,
  },
  {
    slug: 'trumpet',
    label: 'Trumpet',
    blurb: 'Works for trumpet.',
    pattern: /\btrumpet\b/i,
  },
  {
    slug: 'organ',
    label: 'Organ',
    blurb: 'Works for organ.',
    pattern: /\borgan\b/i,
  },
  {
    slug: 'harpsichord',
    label: 'Harpsichord',
    blurb: 'Works for harpsichord and clavier.',
    pattern: /\b(harpsichord|clavier|cembalo)\b/i,
  },
  {
    slug: 'guitar',
    label: 'Guitar',
    blurb: 'Works for guitar.',
    pattern: /\bguitar\b/i,
  },
  {
    slug: 'harp',
    label: 'Harp',
    blurb: 'Works for harp.',
    pattern: /\bharp\b/i,
  },
]

/** Instrument slugs named in a work title (often none — orchestral works). */
export function detectInstruments(workTitle: string): string[] {
  return instruments.filter((i) => i.pattern.test(workTitle)).map((i) => i.slug)
}

export function instrumentBySlug(slug: string): Instrument | undefined {
  return instruments.find((i) => i.slug === slug)
}
