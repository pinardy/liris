import type { ClassicalIndex } from '../services/archive/classicalIndex'
import type { ListeningStats } from '../services/db/stats'
import type { Work } from './classical'

/**
 * A personal radio queue derived from listening history: works by your most
 * played composers dominate, works from your favourite periods fill in, and a
 * sprinkle of everything else keeps it from becoming an echo chamber.
 *
 * Seeded by the calendar date so the mix is stable all day and fresh
 * tomorrow — that's what makes it a DAILY mix rather than a shuffle button.
 */

/** How many plays before a mix says anything about taste. */
const MIN_PLAYS = 5

const COMPOSER_WEIGHT = 4
const PERIOD_WEIGHT = 1.5
const EXPLORE_WEIGHT = 0.5

/** Mulberry32 — tiny deterministic PRNG, plenty for sampling a mix. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function daySeed(date: Date): number {
  return date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate()
}

export function dailyMixWorks(
  index: ClassicalIndex,
  stats: ListeningStats,
  date: Date = new Date(),
  count = 12,
): Work[] {
  if (stats.totalPlays < MIN_PLAYS) return []

  const topComposerSlugs = new Set(
    stats.topComposers.map((c) => c.slug).filter((s): s is string => Boolean(s)),
  )
  const topComposerNames = new Set(stats.topComposers.map((c) => c.name))
  const topPeriods = new Set(stats.byPeriod.slice(0, 2).map((p) => p.period))

  function weight(work: Work): number {
    if (
      (work.composerSlug && topComposerSlugs.has(work.composerSlug)) ||
      topComposerNames.has(work.composerName)
    ) {
      return COMPOSER_WEIGHT
    }
    if (work.period && topPeriods.has(work.period)) return PERIOD_WEIGHT
    return EXPLORE_WEIGHT
  }

  // Weighted sampling without replacement. O(count × works) — the catalog is
  // a few hundred works, so simplicity beats an alias table here.
  const rng = mulberry32(daySeed(date))
  const pool = index.works.map((work) => ({ work, w: weight(work) }))
  const picked: Work[] = []
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.w, 0)
    let r = rng() * total
    let idx = 0
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].w
      if (r <= 0) break
    }
    picked.push(pool[idx].work)
    pool.splice(idx, 1)
  }
  return picked
}
