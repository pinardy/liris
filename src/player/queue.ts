import type { Track } from '../types/model'

export type RepeatMode = 'off' | 'all' | 'one'

/** Fisher–Yates. Returns a new array; does not mutate the input. */
export function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Shuffle a queue so that the track at `currentIndex` comes first. */
export function shuffleQueue(queue: Track[], currentIndex: number): Track[] {
  const current = queue[currentIndex]
  const rest = queue.filter((_, i) => i !== currentIndex)
  return current ? [current, ...shuffled(rest)] : shuffled(rest)
}

/**
 * Next index to play, or null to stop.
 * `auto` = advance caused by track ending (vs. user pressing next).
 */
export function nextIndex(
  queueLength: number,
  currentIndex: number,
  repeat: RepeatMode,
  auto: boolean,
): number | null {
  if (queueLength === 0) return null
  if (auto && repeat === 'one') return currentIndex
  if (currentIndex + 1 < queueLength) return currentIndex + 1
  if (repeat === 'all') return 0
  return auto ? null : 0
}

export function prevIndex(queueLength: number, currentIndex: number, repeat: RepeatMode): number {
  if (currentIndex > 0) return currentIndex - 1
  return repeat === 'all' ? Math.max(0, queueLength - 1) : 0
}
