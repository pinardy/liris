import { create } from 'zustand'
import type { Track } from '../types/model'
import * as engine from './audioEngine'
import { nextIndex, prevIndex, shuffled, shuffleQueue, type RepeatMode } from './queue'

const VOLUME_KEY = 'player-volume'

function initialVolume(): number {
  const raw = localStorage.getItem(VOLUME_KEY)
  const v = raw === null ? 1 : Number(raw)
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
}

export interface PlayerState {
  queue: Track[]
  currentIndex: number
  /** Non-null while shuffle is on: the pre-shuffle queue, for restoring order. */
  originalQueue: Track[] | null
  isPlaying: boolean
  positionSec: number
  durationSec: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  /** Epoch ms when the sleep timer will pause playback; null = no timer. */
  sleepTimerEndsAt: number | null
  /** Pause when the current track finishes instead of advancing. */
  sleepAtTrackEnd: boolean

  playQueue: (tracks: Track[], startIndex?: number) => void
  playTrack: (track: Track) => void
  /**
   * Radio mode: shuffle the pool into the queue and loop it endlessly.
   * Turns repeat to 'all' (that's what makes it endless) and leaves the
   * shuffle toggle off — the queue itself is already shuffled.
   */
  startRadio: (tracks: Track[]) => void
  togglePlay: () => void
  next: (auto?: boolean) => void
  prev: () => void
  seek: (sec: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (track: Track) => void
  /** Insert a track right after the currently playing one. */
  playNext: (track: Track) => void
  removeFromQueue: (index: number) => void
  playFromQueue: (index: number) => void
  moveInQueue: (from: number, to: number) => void
  /** minutes, 'track-end', or null to cancel. */
  setSleepTimer: (option: number | 'track-end' | null) => void
  /**
   * Wall-clock check for timer expiry. Mobile browsers throttle background
   * timers heavily, so setTimeout alone can fire minutes late — the engine
   * also calls this on every timeupdate and when the app returns to the
   * foreground.
   */
  checkSleepTimer: () => void
}

let sleepTimeout: ReturnType<typeof setTimeout> | null = null

/** The sleep timer's final seconds ramp the volume down instead of cutting
 *  off mid-phrase. Driven by checkSleepTimer, which media events keep calling
 *  even when background timers are throttled. */
const SLEEP_FADE_MS = 20_000

export const usePlayerStore = create<PlayerState>((set, get) => {
  function startTrack(index: number) {
    const track = get().queue[index]
    if (!track) return
    set({ currentIndex: index, positionSec: 0, durationSec: track.durationSec })
    engine.loadAndPlay(track)
    // Fire-and-forget: record into recently played (lazy so Dexie stays off the hot path).
    void import('../services/db/recents').then(({ recordPlay }) =>
      recordPlay(track).catch(() => {}),
    )
  }

  return {
    queue: [],
    currentIndex: -1,
    originalQueue: null,
    isPlaying: false,
    positionSec: 0,
    durationSec: 0,
    volume: initialVolume(),
    muted: false,
    shuffle: false,
    repeat: 'off',
    sleepTimerEndsAt: null,
    sleepAtTrackEnd: false,

    playQueue: (tracks, startIndex = 0) => {
      if (tracks.length === 0) return
      const { shuffle } = get()
      if (shuffle) {
        const shuffledTracks = shuffleQueue(tracks, startIndex)
        set({ queue: shuffledTracks, originalQueue: tracks })
        startTrack(0)
      } else {
        set({ queue: tracks, originalQueue: null })
        startTrack(startIndex)
      }
    },

    playTrack: (track) => get().playQueue([track], 0),

    startRadio: (tracks) => {
      if (tracks.length === 0) return
      set({
        queue: shuffled(tracks),
        originalQueue: null,
        shuffle: false,
        repeat: 'all',
      })
      startTrack(0)
    },

    togglePlay: () => {
      const { isPlaying, queue, currentIndex } = get()
      if (currentIndex < 0 || !queue[currentIndex]) return
      if (isPlaying) engine.pause()
      else engine.play()
    },

    next: (auto = false) => {
      const { queue, currentIndex, repeat } = get()
      const idx = nextIndex(queue.length, currentIndex, repeat, auto)
      if (idx === null) {
        engine.pause()
        set({ isPlaying: false, positionSec: 0 })
        return
      }
      startTrack(idx)
    },

    prev: () => {
      const { queue, currentIndex, positionSec, repeat } = get()
      if (positionSec > 3 || queue.length <= 1) {
        engine.seek(0)
        return
      }
      startTrack(prevIndex(queue.length, currentIndex, repeat))
    },

    seek: (sec) => engine.seek(sec),

    setVolume: (v) => {
      const clamped = Math.min(1, Math.max(0, v))
      localStorage.setItem(VOLUME_KEY, String(clamped))
      set({ volume: clamped, muted: false })
      engine.setVolume(clamped, false)
    },

    toggleMute: () => {
      const muted = !get().muted
      set({ muted })
      engine.setVolume(get().volume, muted)
    },

    toggleShuffle: () => {
      const { shuffle, queue, currentIndex, originalQueue } = get()
      if (queue.length === 0) {
        set({ shuffle: !shuffle })
        return
      }
      const current = queue[currentIndex]
      if (!shuffle) {
        set({
          shuffle: true,
          originalQueue: queue,
          queue: shuffleQueue(queue, currentIndex),
          currentIndex: 0,
        })
      } else {
        const restored = originalQueue ?? queue
        const idx = current ? restored.findIndex((t) => t.id === current.id) : 0
        set({
          shuffle: false,
          originalQueue: null,
          queue: restored,
          currentIndex: Math.max(0, idx),
        })
      }
    },

    cycleRepeat: () => {
      const order: RepeatMode[] = ['off', 'all', 'one']
      const { repeat } = get()
      set({ repeat: order[(order.indexOf(repeat) + 1) % order.length] })
    },

    playNext: (track) => {
      const { queue, currentIndex } = get()
      if (queue.length === 0) {
        get().playQueue([track], 0)
        return
      }
      const newQueue = [...queue]
      newQueue.splice(currentIndex + 1, 0, track)
      set({ queue: newQueue })
      // Keep the un-shuffled order in sync so un-shuffle doesn't lose it.
      const { originalQueue } = get()
      if (originalQueue) {
        const current = queue[currentIndex]
        const idx = current ? originalQueue.findIndex((t) => t.id === current.id) : -1
        const newOriginal = [...originalQueue]
        newOriginal.splice(idx + 1, 0, track)
        set({ originalQueue: newOriginal })
      }
    },

    addToQueue: (track) => {
      const { queue, currentIndex } = get()
      if (queue.length === 0) {
        get().playQueue([track], 0)
        return
      }
      set({ queue: [...queue, track] })
      // Keep the un-shuffled order in sync so un-shuffle doesn't lose the addition.
      const { originalQueue } = get()
      if (originalQueue) set({ originalQueue: [...originalQueue, track] })
      void currentIndex
    },

    removeFromQueue: (index) => {
      const { queue, currentIndex } = get()
      if (index === currentIndex) return // removing the playing track is not supported
      const newQueue = queue.filter((_, i) => i !== index)
      set({
        queue: newQueue,
        currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex,
      })
    },

    playFromQueue: (index) => startTrack(index),

    moveInQueue: (from, to) => {
      const { queue, currentIndex } = get()
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= queue.length ||
        to >= queue.length
      )
        return
      const newQueue = [...queue]
      const [moved] = newQueue.splice(from, 1)
      newQueue.splice(to, 0, moved)
      let idx = currentIndex
      if (from === currentIndex) idx = to
      else if (from < currentIndex && to >= currentIndex) idx = currentIndex - 1
      else if (from > currentIndex && to <= currentIndex) idx = currentIndex + 1
      set({ queue: newQueue, currentIndex: idx })
    },

    setSleepTimer: (option) => {
      if (sleepTimeout) {
        clearTimeout(sleepTimeout)
        sleepTimeout = null
      }
      // A new (or cancelled) timer undoes any fade already in progress.
      engine.setSleepFade(1)
      if (option === null) {
        set({ sleepTimerEndsAt: null, sleepAtTrackEnd: false })
        return
      }
      if (option === 'track-end') {
        set({ sleepAtTrackEnd: true, sleepTimerEndsAt: null })
        return
      }
      set({ sleepTimerEndsAt: Date.now() + option * 60_000, sleepAtTrackEnd: false })
      sleepTimeout = setTimeout(() => {
        sleepTimeout = null
        get().checkSleepTimer()
      }, option * 60_000)
    },

    checkSleepTimer: () => {
      const { sleepTimerEndsAt } = get()
      if (sleepTimerEndsAt === null) return
      const remaining = sleepTimerEndsAt - Date.now()
      if (remaining > SLEEP_FADE_MS) return
      if (remaining > 0) {
        engine.setSleepFade(remaining / SLEEP_FADE_MS)
        return
      }
      if (sleepTimeout) {
        clearTimeout(sleepTimeout)
        sleepTimeout = null
      }
      engine.pause()
      // Restore full volume once paused, so a later resume isn't silent.
      engine.setSleepFade(1)
      set({ sleepTimerEndsAt: null })
    },
  }
})

/** Selector for the currently playing track. */
export const selectCurrentTrack = (s: PlayerState): Track | undefined =>
  s.queue[s.currentIndex]
