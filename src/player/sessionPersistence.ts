import { db } from '../services/db/db'
import { usePlayerStore, type PersistedSession, type PlayerState } from './playerStore'

/**
 * Resume where you left off: the queue, current track and position are
 * snapshotted into the `cache` table and restored (paused) on the next boot.
 * Movements are long — losing a 20-minute position to a reload hurts.
 *
 * Everything here is best-effort: persistence failing must never affect
 * playback, so every Dexie call swallows its errors.
 */

const SESSION_KEY = 'player-session-v1'

/** Position-only changes are throttled; structural changes save immediately. */
const POSITION_WRITE_MS = 5_000

function snapshot(s: PlayerState): PersistedSession {
  return {
    queue: s.queue,
    currentIndex: s.currentIndex,
    originalQueue: s.originalQueue,
    positionSec: s.positionSec,
    shuffle: s.shuffle,
    repeat: s.repeat,
    radioMode: s.radioMode,
  }
}

async function persist(s: PlayerState): Promise<void> {
  try {
    if (s.queue.length === 0) {
      await db.cache.delete(SESSION_KEY)
      return
    }
    await db.cache.put({ key: SESSION_KEY, value: snapshot(s), savedAt: Date.now() })
  } catch {
    // Quota errors etc. — resume is an optimisation, never a failure.
  }
}

function looksLikeSession(value: unknown): value is PersistedSession {
  const v = value as PersistedSession | undefined
  return Boolean(v && Array.isArray(v.queue) && typeof v.currentIndex === 'number')
}

/** Restore the previous session, then keep persisting this one. */
export async function initSessionPersistence(): Promise<void> {
  try {
    const row = await db.cache.get(SESSION_KEY)
    if (row && looksLikeSession(row.value) && row.value.queue.length > 0) {
      usePlayerStore.getState().restoreSession(row.value)
    }
  } catch {
    // No session to restore; start fresh.
  }

  let lastWrite = 0
  usePlayerStore.subscribe((s, prev) => {
    const structural =
      s.queue !== prev.queue ||
      s.currentIndex !== prev.currentIndex ||
      s.repeat !== prev.repeat ||
      s.shuffle !== prev.shuffle
    const positionTick =
      s.positionSec !== prev.positionSec && Date.now() - lastWrite > POSITION_WRITE_MS
    if (!structural && !positionTick) return
    lastWrite = Date.now()
    void persist(s)
  })

  // Final flush so at most a moment of position is lost on tab close.
  window.addEventListener('pagehide', () => {
    void persist(usePlayerStore.getState())
  })
}
