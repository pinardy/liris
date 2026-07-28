import { describe, expect, it } from 'vitest'
import type { ClassicalIndex } from '../services/archive/classicalIndex'
import type { Work } from './classical'
import { describeSmartRules, evaluateSmartRules } from './smartRules'

function work(over: Partial<Work>): Work {
  return {
    id: over.title ?? 'w',
    title: 'Work',
    composerName: 'Composer',
    recordings: [
      {
        id: 'r',
        collectionId: 'c',
        collectionName: 'Collection',
        license: 'PD',
        performers: [],
        tracks: [],
        durationSec: 600,
      },
    ],
    ...over,
  }
}

const works = [
  work({
    title: 'Brandenburg Concerto No. 3',
    composerSlug: 'bach',
    period: 'Baroque',
    formSlug: 'concerto',
  }),
  work({
    title: 'Piano Concerto No. 21',
    composerSlug: 'mozart',
    period: 'Classical',
    formSlug: 'concerto',
  }),
  work({
    title: 'Nocturne in E flat',
    composerSlug: 'chopin',
    period: 'Romantic',
    formSlug: 'piano-pieces',
    recordings: [
      {
        id: 'r2',
        collectionId: 'c',
        collectionName: 'Collection',
        license: 'PD',
        performers: [],
        tracks: [],
        durationSec: 300,
      },
    ],
  }),
]

// evaluateSmartRules only reads .works — a stub index keeps the test honest.
const index = { works } as ClassicalIndex

describe('evaluateSmartRules', () => {
  it('matches everything with empty rules', () => {
    expect(evaluateSmartRules({}, index)).toHaveLength(3)
  })

  it('filters by period', () => {
    const out = evaluateSmartRules({ periods: ['Baroque'] }, index)
    expect(out.map((w) => w.title)).toEqual(['Brandenburg Concerto No. 3'])
  })

  it('ORs values within a field', () => {
    const out = evaluateSmartRules({ periods: ['Baroque', 'Classical'] }, index)
    expect(out).toHaveLength(2)
  })

  it('ANDs fields together', () => {
    const out = evaluateSmartRules(
      { periods: ['Baroque', 'Classical'], formSlugs: ['concerto'] },
      index,
    )
    expect(out).toHaveLength(2)
    const narrower = evaluateSmartRules(
      { periods: ['Classical'], formSlugs: ['concerto'] },
      index,
    )
    expect(narrower.map((w) => w.title)).toEqual(['Piano Concerto No. 21'])
  })

  it('filters by instrument detected from the title', () => {
    const out = evaluateSmartRules({ instruments: ['piano'] }, index)
    expect(out.map((w) => w.title)).toEqual(['Piano Concerto No. 21'])
  })

  it('filters by composer', () => {
    const out = evaluateSmartRules({ composerSlugs: ['chopin'] }, index)
    expect(out.map((w) => w.title)).toEqual(['Nocturne in E flat'])
  })

  it('filters by maximum work length', () => {
    const out = evaluateSmartRules({ maxWorkMinutes: 5 }, index)
    expect(out.map((w) => w.title)).toEqual(['Nocturne in E flat'])
  })
})

describe('describeSmartRules', () => {
  it('summarizes empty rules', () => {
    expect(describeSmartRules({})).toBe('All works')
  })

  it('joins the set fields', () => {
    expect(
      describeSmartRules({
        periods: ['Baroque'],
        formSlugs: ['concerto'],
        maxWorkMinutes: 15,
      }),
    ).toBe('Baroque · Concertos · under 15 min')
  })

  it('names composers by surname', () => {
    expect(describeSmartRules({ composerSlugs: ['bach'] })).toBe('Bach')
  })

  it('keeps canonical era order regardless of click order', () => {
    expect(describeSmartRules({ periods: ['Romantic', 'Baroque'] })).toBe(
      'Baroque, Romantic',
    )
  })
})
