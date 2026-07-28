import { findComposer, type Period } from '../../lib/composers'
import { db } from './db'

export interface ComposerStat {
  name: string
  /** Curated slug when the name resolves, for portraits and linking. */
  slug?: string
  plays: number
}

export interface WorkStat {
  title: string
  composer: string
  plays: number
}

export interface PeriodStat {
  period: Period | 'Other'
  plays: number
}

export interface ListeningStats {
  totalPlays: number
  totalSec: number
  distinctWorks: number
  distinctComposers: number
  firstPlayAt: number | null
  /** Consecutive days listened, counting back from today (or yesterday). */
  dayStreak: number
  daysActive: number
  topComposers: ComposerStat[]
  topWorks: WorkStat[]
  byPeriod: PeriodStat[]
}

/** Local calendar day, so late-night listening counts for the right day. */
function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** One pass over the play history; ≤20k rows, so a full scan stays instant. */
export async function getListeningStats(): Promise<ListeningStats> {
  const plays = await db.plays.toArray()

  const byComposer = new Map<string, ComposerStat>()
  const byWork = new Map<string, WorkStat>()
  const byPeriod = new Map<Period | 'Other', number>()
  const days = new Set<string>()
  let totalSec = 0
  let firstPlayAt: number | null = null

  for (const p of plays) {
    totalSec += p.durationSec
    days.add(dayKey(p.playedAt))
    if (firstPlayAt === null || p.playedAt < firstPlayAt) firstPlayAt = p.playedAt

    const composer = findComposer(p.composer)
    const composerName = composer?.name ?? p.composer
    const c = byComposer.get(composerName) ?? {
      name: composerName,
      slug: composer?.slug,
      plays: 0,
    }
    c.plays++
    byComposer.set(composerName, c)

    const workKey = `${composerName}::${p.work}`
    const w = byWork.get(workKey) ?? { title: p.work, composer: composerName, plays: 0 }
    w.plays++
    byWork.set(workKey, w)

    const period = composer?.period ?? 'Other'
    byPeriod.set(period, (byPeriod.get(period) ?? 0) + 1)
  }

  // Streak: walk back day by day from today; a quiet today doesn't break a
  // streak that ran through yesterday.
  let dayStreak = 0
  const cursor = new Date()
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor.getTime()))) {
    dayStreak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    totalPlays: plays.length,
    totalSec,
    distinctWorks: byWork.size,
    distinctComposers: byComposer.size,
    firstPlayAt,
    dayStreak,
    daysActive: days.size,
    topComposers: [...byComposer.values()]
      .sort((a, b) => b.plays - a.plays || a.name.localeCompare(b.name))
      .slice(0, 8),
    topWorks: [...byWork.values()]
      .sort((a, b) => b.plays - a.plays || a.title.localeCompare(b.title))
      .slice(0, 8),
    byPeriod: [...byPeriod.entries()]
      .map(([period, count]) => ({ period, plays: count }))
      .sort((a, b) => b.plays - a.plays),
  }
}
