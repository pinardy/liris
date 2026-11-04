// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Track } from '../types/model'

// The store drives a DOM audio engine; these tests cover the state machine,
// so the engine is mocked and every call into it is observable.
vi.mock('./audioEngine', () => ({
  loadAndPlay: vi.fn(async () => {}),
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  setSleepFade: vi.fn(),
  setPlaybackRate: vi.fn(),
  // Null = the engine holds nothing, which is exactly the restored-session
  // state; individual tests override it.
  loadedTrackId: vi.fn(() => null as string | null),
}))
// recordPlay would hit IndexedDB, which jsdom doesn't provide.
vi.mock('../services/db/recents', () => ({ recordPlay: vi.fn(async () => {}) }))

import * as engine from './audioEngine'
import { PLAYBACK_RATES, usePlayerStore } from './playerStore'

function track(id: string, album = 'Work A'): Track {
  return {
    id,
    source: 'archive',
    title: `Movement ${id}`,
    artist: 'Composer',
    album,
    durationSec: 100,
    addedAt: 0,
  }
}

const initial = usePlayerStore.getState()

beforeEach(() => {
  vi.clearAllMocks()
  usePlayerStore.setState(initial, true)
})

describe('startRadio', () => {
  it('keeps every group contiguous and in order', () => {
    const groups = [
      [track('a1'), track('a2'), track('a3')],
      [track('b1'), track('b2')],
      [track('c1')],
    ]
    usePlayerStore.getState().startRadio(groups)
    const ids = usePlayerStore.getState().queue.map((t) => t.id)
    expect(ids).toHaveLength(6)
    for (const group of groups) {
      const start = ids.indexOf(group[0].id)
      expect(start).toBeGreaterThanOrEqual(0)
      expect(ids.slice(start, start + group.length)).toEqual(group.map((t) => t.id))
    }
  })

  it('switches on repeat-all and radio mode; ordinary plays clear it', () => {
    usePlayerStore.getState().startRadio([[track('a')]])
    expect(usePlayerStore.getState().radioMode).toBe(true)
    expect(usePlayerStore.getState().repeat).toBe('all')
    usePlayerStore.getState().playQueue([track('x')])
    expect(usePlayerStore.getState().radioMode).toBe(false)
  })

  it('ignores empty groups and empty input', () => {
    usePlayerStore.getState().startRadio([[], []])
    expect(usePlayerStore.getState().queue).toHaveLength(0)
    expect(engine.loadAndPlay).not.toHaveBeenCalled()
  })
})

describe('queue editing', () => {
  it('removeFromQueue keeps currentIndex pointing at the same track', () => {
    usePlayerStore.getState().playQueue([track('a'), track('b'), track('c')], 1)
    usePlayerStore.getState().removeFromQueue(0)
    const s = usePlayerStore.getState()
    expect(s.queue.map((t) => t.id)).toEqual(['b', 'c'])
    expect(s.queue[s.currentIndex].id).toBe('b')
  })

  it('moveInQueue tracks the playing item across moves in both directions', () => {
    usePlayerStore.getState().playQueue([track('a'), track('b'), track('c')], 1)
    usePlayerStore.getState().moveInQueue(1, 2)
    let s = usePlayerStore.getState()
    expect(s.queue[s.currentIndex].id).toBe('b')
    usePlayerStore.getState().moveInQueue(0, 2)
    s = usePlayerStore.getState()
    expect(s.queue[s.currentIndex].id).toBe('b')
  })
})

describe('restored session', () => {
  // A long movement, so a mid-track resume position is realistic.
  const long = (id: string) => ({ ...track(id), durationSec: 1200 })
  const saved = {
    queue: [long('a'), long('b')],
    currentIndex: 1,
    originalQueue: null,
    positionSec: 620,
    shuffle: false,
    repeat: 'off' as const,
    radioMode: false,
  }

  it('scrubbing before playback moves the pending position, not the engine', () => {
    usePlayerStore.getState().restoreSession(saved)
    expect(usePlayerStore.getState().restoredFromSession).toBe(true)

    // The engine holds no track yet: handing this to an empty audio element
    // would clamp to 0 and wipe the 10-minute resume point.
    usePlayerStore.getState().seek(300)
    expect(engine.seek).not.toHaveBeenCalled()
    expect(usePlayerStore.getState().positionSec).toBe(300)
  })

  it('clamps a pending seek to the track duration and never below zero', () => {
    usePlayerStore.getState().restoreSession(saved)
    usePlayerStore.getState().seek(99_999)
    expect(usePlayerStore.getState().positionSec).toBe(1200) // track duration
    usePlayerStore.getState().seek(-5)
    expect(usePlayerStore.getState().positionSec).toBe(0)
  })

  it('seeks through to the engine once it holds the current track', () => {
    usePlayerStore.getState().playQueue([track('a')], 0)
    vi.mocked(engine.loadedTrackId).mockReturnValue('a')
    usePlayerStore.getState().seek(42)
    expect(engine.seek).toHaveBeenCalledWith(42)
    vi.mocked(engine.loadedTrackId).mockReturnValue(null)
  })

  it('resuming play loads the track and seeks to the pending position', async () => {
    usePlayerStore.getState().restoreSession(saved)
    usePlayerStore.getState().togglePlay()
    expect(engine.loadAndPlay).toHaveBeenCalledWith(saved.queue[1])
    await Promise.resolve()
    expect(engine.seek).toHaveBeenCalledWith(620)
    expect(usePlayerStore.getState().restoredFromSession).toBe(false)
  })

  it('a restore with no meaningful position is not flagged as a resume', () => {
    usePlayerStore.getState().restoreSession({ ...saved, positionSec: 0 })
    expect(usePlayerStore.getState().restoredFromSession).toBe(false)
  })

  it('restart-from-previous goes through the same guard, not the empty element', () => {
    usePlayerStore.getState().restoreSession(saved)
    // positionSec is 620 (> 3), so prev() restarts the track rather than
    // stepping back — and must do it without consulting the unloaded element.
    usePlayerStore.getState().prev()
    expect(engine.seek).not.toHaveBeenCalled()
    expect(usePlayerStore.getState().positionSec).toBe(0)
  })
})

describe('playback rate', () => {
  it('clamps and forwards to the engine with the pitch flag', () => {
    usePlayerStore.getState().setPlaybackRate(0.7)
    expect(engine.setPlaybackRate).toHaveBeenCalledWith(0.7, true)
    usePlayerStore.getState().setPlaybackRate(99)
    expect(usePlayerStore.getState().playbackRate).toBe(2)
    usePlayerStore.getState().setPlaybackRate(0.01)
    expect(usePlayerStore.getState().playbackRate).toBe(0.25)
  })

  it('togglePreservePitch re-applies the current rate', () => {
    usePlayerStore.getState().setPlaybackRate(0.8)
    usePlayerStore.getState().togglePreservePitch()
    expect(engine.setPlaybackRate).toHaveBeenLastCalledWith(0.8, false)
  })

  it('exposes 1 as a selectable rate', () => {
    expect(PLAYBACK_RATES).toContain(1)
  })
})

describe('sleep timer fade', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('ramps the fade through the final 20 seconds and restores after pause', () => {
    vi.setSystemTime(1_000_000)
    usePlayerStore.getState().setSleepTimer(1) // one minute
    expect(engine.setSleepFade).toHaveBeenCalledWith(1)

    // 50s in: 10s remain of a 20s fade window → factor 0.5.
    vi.setSystemTime(1_000_000 + 50_000)
    usePlayerStore.getState().checkSleepTimer()
    expect(engine.setSleepFade).toHaveBeenLastCalledWith(0.5)

    // Past expiry: paused, fade restored, timer cleared.
    vi.setSystemTime(1_000_000 + 61_000)
    usePlayerStore.getState().checkSleepTimer()
    expect(engine.pause).toHaveBeenCalled()
    expect(engine.setSleepFade).toHaveBeenLastCalledWith(1)
    expect(usePlayerStore.getState().sleepTimer).toBeNull()
  })

  it('cancelling a timer mid-fade restores full volume', () => {
    vi.setSystemTime(2_000_000)
    usePlayerStore.getState().setSleepTimer(1)
    vi.setSystemTime(2_000_000 + 55_000)
    usePlayerStore.getState().checkSleepTimer()
    usePlayerStore.getState().setSleepTimer(null)
    expect(engine.setSleepFade).toHaveBeenLastCalledWith(1)
  })
})
