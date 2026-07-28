import { describe, expect, it } from 'vitest'
import type { ClassicalIndex } from '../services/archive/classicalIndex'
import type { ListeningStats } from '../services/db/stats'
import type { Work } from './classical'
import { dailyMixWorks } from './dailyMix'

function work(id: string, composerSlug: string, period: Work['period']): Work {
  return {
    id,
    title: id,
    composerName: composerSlug,
    composerSlug,
    period,
    recordings: [],
  }
}

const works: Work[] = [
  ...Array.from({ length: 10 }, (_, i) => work(`bach-${i}`, 'bach', 'Baroque')),
  ...Array.from({ length: 10 }, (_, i) => work(`chopin-${i}`, 'chopin', 'Romantic')),
  ...Array.from({ length: 10 }, (_, i) => work(`mozart-${i}`, 'mozart', 'Classical')),
]

// dailyMixWorks only reads .works.
const index = { works } as ClassicalIndex

function stats(over: Partial<ListeningStats>): ListeningStats {
  return {
    totalPlays: 50,
    totalSec: 0,
    distinctWorks: 0,
    distinctComposers: 0,
    firstPlayAt: null,
    dayStreak: 0,
    daysActive: 0,
    topComposers: [{ name: 'Johann Sebastian Bach', slug: 'bach', plays: 40 }],
    topWorks: [],
    byPeriod: [{ period: 'Baroque', plays: 40 }],
    playsByDay: new Map(),
    ...over,
  }
}

describe('dailyMixWorks', () => {
  const date = new Date(2026, 6, 28)

  it('returns nothing before there is a taste to model', () => {
    expect(dailyMixWorks(index, stats({ totalPlays: 2 }), date)).toEqual([])
  })

  it('respects the requested count without repeats', () => {
    const mix = dailyMixWorks(index, stats({}), date, 8)
    expect(mix).toHaveLength(8)
    expect(new Set(mix.map((w) => w.id)).size).toBe(8)
  })

  it('is deterministic for the same day', () => {
    const a = dailyMixWorks(index, stats({}), date).map((w) => w.id)
    const b = dailyMixWorks(index, stats({}), date).map((w) => w.id)
    expect(a).toEqual(b)
  })

  it('changes from one day to the next', () => {
    const a = dailyMixWorks(index, stats({}), date).map((w) => w.id)
    const b = dailyMixWorks(index, stats({}), new Date(2026, 6, 29)).map((w) => w.id)
    expect(a).not.toEqual(b)
  })

  it('leans toward the listener’s top composer', () => {
    const mix = dailyMixWorks(index, stats({}), date, 12)
    const bachCount = mix.filter((w) => w.composerSlug === 'bach').length
    // 10 of 30 works are Bach, but they carry 4× weight — expect a majority
    // of his works to make the cut.
    expect(bachCount).toBeGreaterThanOrEqual(6)
  })

  it('still explores beyond the profile', () => {
    const mix = dailyMixWorks(index, stats({}), date, 12)
    expect(mix.some((w) => w.composerSlug === 'mozart' || w.composerSlug === 'chopin')).toBe(
      true,
    )
  })
})
