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

/** What survives a reload: the queue and where in it the listener was.
 *  Volume/EQ persist separately; sleep timers deliberately do not survive. */
export interface PersistedSession {
  queue: Track[]
  currentIndex: number
  originalQueue: Track[] | null
  positionSec: number
  shuffle: boolean
  repeat: RepeatMode
  radioMode: boolean
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
  /** Pause once the current WORK finishes — after the last movement whose
   *  album/artist match the playing track's. The natural unit for classical. */
  sleepAtWorkEnd: boolean
  /** True while the queue was built by startRadio (cleared by other plays). */
  radioMode: boolean

  playQueue: (tracks: Track[], startIndex?: number) => void
  playTrack: (track: Track) => void
  /** Play a single track starting at a saved position (bookmarks). */
  playTrackFrom: (track: Track, positionSec: number) => void
  /**
   * Radio mode: shuffle GROUPS of tracks (whole works — a symphony is never
   * split mid-radio) into one queue and loop it endlessly. Turns repeat to
   * 'all' (that's what makes it endless) and leaves the shuffle toggle off —
   * toggling shuffle on would tear the works apart into single movements.
   */
  startRadio: (groups: Track[][]) => void
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
  /** Empty the queue and stop playback. */
  clearQueue: () => void
  playFromQueue: (index: number) => void
  moveInQueue: (from: number, to: number) => void
  /**
   * Apply a persisted session on boot: the queue and position come back
   * paused; the engine only loads audio when the user actually hits play.
   * No-ops if playback already started (the restore read is async).
   */
  restoreSession: (saved: PersistedSession) => void
  /** minutes, 'track-end', 'work-end', or null to cancel. */
  setSleepTimer: (option: number | 'track-end' | 'work-end' | null) => void
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
    sleepAtWorkEnd: false,
    radioMode: false,

    playQueue: (tracks, startIndex = 0) => {
      if (tracks.length === 0) return
      set({ radioMode: false })
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

    playTrackFrom: (track, positionSec) => {
      set({
        radioMode: false,
        queue: [track],
        originalQueue: null,
        currentIndex: 0,
        positionSec,
        durationSec: track.durationSec,
      })
      // Seek once playback is actually rolling — before that the element may
      // not have metadata and the position wouldn't stick.
      void engine.loadAndPlay(track).then(() => {
        if (positionSec > 1) engine.seek(positionSec)
      })
      void import('../services/db/recents').then(({ recordPlay }) =>
        recordPlay(track).catch(() => {}),
      )
    },

    startRadio: (groups) => {
      const queue = shuffled(groups.filter((g) => g.length > 0)).flat()
      if (queue.length === 0) return
      set({
        queue,
        originalQueue: null,
        shuffle: false,
        repeat: 'all',
        radioMode: true,
      })
      startTrack(0)
    },

    togglePlay: () => {
      const { isPlaying, queue, currentIndex, positionSec } = get()
      const track = queue[currentIndex]
      if (!track) return
      if (isPlaying) {
        engine.pause()
        return
      }
      // After a session restore (or removing the paused row) the engine may
      // hold a different track than the store points at — load the right one
      // and pick up at the saved position instead of resuming a stale element.
      if (engine.loadedTrackId() !== track.id) {
        const resumeAt = positionSec
        void engine.loadAndPlay(track).then(() => {
          if (resumeAt > 1 && !track.id.startsWith('radio:')) engine.seek(resumeAt)
        })
        return
      }
      engine.play()
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
      const { queue } = get()
      if (queue.length === 0) {
        get().playQueue([track], 0)
        return
      }
      set({ queue: [...queue, track] })
      // Keep the un-shuffled order in sync so un-shuffle doesn't lose the addition.
      const { originalQueue } = get()
      if (originalQueue) set({ originalQueue: [...originalQueue, track] })
    },

    removeFromQueue: (index) => {
      const { queue, currentIndex, originalQueue, isPlaying } = get()
      const removed = queue[index]
      if (!removed) return
      const newQueue = queue.filter((_, i) => i !== index)
      // Keep the un-shuffled order in sync (drop one occurrence of this track).
      if (originalQueue) {
        const oi = originalQueue.findIndex((t) => t.id === removed.id)
        if (oi >= 0) set({ originalQueue: originalQueue.filter((_, i) => i !== oi) })
      }
      if (index !== currentIndex) {
        set({
          queue: newQueue,
          currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex,
        })
        return
      }
      // Removing the playing row: hand off to whichever track slides in.
      if (newQueue.length === 0) {
        get().clearQueue()
        return
      }
      const idx = Math.min(index, newQueue.length - 1)
      set({ queue: newQueue })
      if (isPlaying) {
        startTrack(idx)
      } else {
        // Stay paused; togglePlay notices the engine holds the removed track
        // and loads this one on resume.
        set({ currentIndex: idx, positionSec: 0, durationSec: newQueue[idx].durationSec })
      }
    },

    clearQueue: () => {
      engine.pause()
      set({
        queue: [],
        currentIndex: -1,
        originalQueue: null,
        isPlaying: false,
        positionSec: 0,
        durationSec: 0,
        radioMode: false,
      })
    },

    playFromQueue: (index) => startTrack(index),

    restoreSession: (saved) => {
      const { queue, currentIndex } = get()
      if (queue.length > 0 || currentIndex >= 0) return
      const track = saved.queue[saved.currentIndex]
      if (!track) return
      set({
        queue: saved.queue,
        currentIndex: saved.currentIndex,
        originalQueue: saved.originalQueue,
        shuffle: saved.shuffle,
        repeat: saved.repeat,
        radioMode: saved.radioMode,
        positionSec: saved.positionSec,
        durationSec: track.durationSec,
      })
    },

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
        set({ sleepTimerEndsAt: null, sleepAtTrackEnd: false, sleepAtWorkEnd: false })
        return
      }
      if (option === 'track-end') {
        set({ sleepAtTrackEnd: true, sleepAtWorkEnd: false, sleepTimerEndsAt: null })
        return
      }
      if (option === 'work-end') {
        set({ sleepAtWorkEnd: true, sleepAtTrackEnd: false, sleepTimerEndsAt: null })
        return
      }
      set({
        sleepTimerEndsAt: Date.now() + option * 60_000,
        sleepAtTrackEnd: false,
        sleepAtWorkEnd: false,
      })
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
