import type { Track } from '../types/model'
import { updateMediaSession, updatePositionState } from './mediaSession'
import { usePlayerStore } from './playerStore'
import { nextIndex } from './queue'
import { resolvePlayableUrl } from './resolveSource'

/**
 * Singleton playback engine, living outside React. Commands come in from
 * playerStore actions; element events sync state back via setState.
 *
 * Two elements:
 * - `audio` plays tracks and (when the equalizer is enabled) is routed through
 *   the Web Audio graph, which requires crossOrigin CORS loads.
 * - `radioAudio` plays live radio streams. Radio redirects through hops
 *   without CORS headers, so it must stay OUT of the graph and load without
 *   crossOrigin — hence its own element. Radio therefore bypasses the EQ.
 */

const FX_ENABLED_KEY = 'audio-fx-enabled'

function isRadioTrack(track: Track): boolean {
  return track.id.startsWith('radio:')
}

function createElement(): HTMLAudioElement {
  const el = new Audio()
  el.preload = 'metadata'
  wire(el)
  return el
}

const audio = createElement()
if (localStorage.getItem(FX_ENABLED_KEY) === '1') {
  audio.crossOrigin = 'anonymous'
}
let radioAudio: HTMLAudioElement | null = null
let active = audio

function getRadioElement(): HTMLAudioElement {
  if (!radioAudio) radioAudio = createElement()
  return radioAudio
}

/** The element the equalizer graph attaches to. */
export function getMainElement(): HTMLAudioElement {
  return audio
}

const RETRY_DELAY_MS = 1000
const PREFETCH_THRESHOLD_SEC = 20

let currentObjectUrl: string | null = null
let loadToken = 0
let lastTimeWrite = 0
let consecutiveErrors = 0

/**
 * State of the load currently owning playback. All failure handling is keyed
 * off this — never off the store's currentIndex, which may already point at a
 * different track by the time an error event is dispatched.
 */
let currentLoad: {
  token: number
  track: Track
  url: string
  retried: boolean
  /** A failure for this load was already processed (dedupes the element
   *  'error' event firing alongside a play() promise rejection). */
  handled: boolean
} | null = null

function skipAfterError(track: Track) {
  notifyTrackError(track)
  consecutiveErrors++
  const { queue } = usePlayerStore.getState()
  // Guard: if everything is failing (e.g. offline + repeat all), stop instead
  // of skipping forever.
  if (consecutiveErrors >= Math.max(queue.length, 1) || consecutiveErrors >= 10) {
    consecutiveErrors = 0
    return
  }
  usePlayerStore.getState().next(true)
}

/**
 * Single path for genuine load/playback failures. Transient network hiccups
 * (archive.org storage nodes, flaky Jamendo mirrors) are common, so the first
 * failure retries the same URL once before the track is skipped.
 */
function handleFailure(token: number) {
  const load = currentLoad
  if (!load || load.token !== token || token !== loadToken || load.handled) return
  load.handled = true
  usePlayerStore.setState({ isPlaying: false })

  if (!load.retried) {
    load.retried = true
    setTimeout(() => {
      if (load.token !== loadToken) return
      load.handled = false
      void attemptPlay(load)
    }, RETRY_DELAY_MS)
    return
  }
  skipAfterError(load.track)
}

async function attemptPlay(load: NonNullable<typeof currentLoad>) {
  const el = isRadioTrack(load.track) ? getRadioElement() : audio
  if (el !== active) {
    active.pause()
    active.removeAttribute('src')
    active.load()
    active = el
  }
  // Equalizer graph must exist before play; created here so the AudioContext
  // is born inside a user-gesture call stack.
  if (el === audio && localStorage.getItem(FX_ENABLED_KEY) === '1') {
    const fx = await import('./audioFx')
    fx.ensureGraph(audio)
    fx.resumeContext()
  }
  el.src = load.url
  applyVolume()
  try {
    await el.play()
    if (load.token !== loadToken) return
    consecutiveErrors = 0
    void updateMediaSession(load.track)
  } catch (err) {
    if (load.token !== loadToken) return
    if (!(err instanceof Error)) return handleFailure(load.token)
    // AbortError: this play() was superseded by a newer load or an explicit
    // pause — never a media failure, so never skip because of it.
    if (err.name === 'AbortError') return
    // Autoplay policy rejection: reflect paused state, don't skip.
    if (err.name === 'NotAllowedError') {
      usePlayerStore.setState({ isPlaying: false })
      return
    }
    console.error('Playback failed', err)
    handleFailure(load.token)
  }
}

function releaseObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
}

export async function loadAndPlay(track: Track): Promise<void> {
  const token = ++loadToken
  let url: string
  let isObjectUrl = false
  try {
    const resolved = await resolvePlayableUrl(track)
    url = resolved.url
    isObjectUrl = resolved.isObjectUrl
  } catch (err) {
    // Unresolvable source (e.g. local file blob missing from IndexedDB) —
    // retrying can't help, skip directly.
    if (token !== loadToken) return
    console.error('Could not resolve track source', err)
    usePlayerStore.setState({ isPlaying: false })
    skipAfterError(track)
    return
  }
  if (token !== loadToken) {
    // A newer track was requested while we were resolving; discard.
    if (isObjectUrl) URL.revokeObjectURL(url)
    return
  }
  releaseObjectUrl()
  if (isObjectUrl) currentObjectUrl = url
  currentLoad = { token, track, url, retried: false, handled: false }
  await attemptPlay(currentLoad)
}

/** Reload the current track in place (used when enabling the equalizer,
 *  which changes the element's CORS mode). Restores the play position. */
export async function reloadCurrentTrack(): Promise<void> {
  const s = usePlayerStore.getState()
  const track = s.queue[s.currentIndex]
  if (!track) return
  const pos = active.currentTime
  await loadAndPlay(track)
  if (Number.isFinite(pos) && pos > 1 && !isRadioTrack(track)) seek(pos)
}

export function play(): void {
  if (localStorage.getItem(FX_ENABLED_KEY) === '1' && active === audio) {
    void import('./audioFx').then((fx) => fx.resumeContext())
  }
  active.play().catch(() => usePlayerStore.setState({ isPlaying: false }))
}

export function pause(): void {
  active.pause()
}

export function seek(sec: number): void {
  if (Number.isFinite(active.duration)) {
    active.currentTime = Math.min(Math.max(0, sec), active.duration)
  } else {
    active.currentTime = Math.max(0, sec)
  }
  usePlayerStore.setState({ positionSec: active.currentTime })
  updatePositionState(active)
}

export function setVolume(volume: number, muted: boolean): void {
  audio.volume = volume
  audio.muted = muted
  if (radioAudio) {
    radioAudio.volume = volume
    radioAudio.muted = muted
  }
}

function applyVolume() {
  const { volume, muted } = usePlayerStore.getState()
  setVolume(volume, muted)
}

// ---- next-track prefetch ----

// A detached element (not fetch()) so no CORS is needed and the browser
// manages Range requests itself. Warms up DNS/TLS and buffers the opening of
// the next track so auto-advance doesn't stall on slow storage nodes.
const prefetcher = new Audio()
prefetcher.preload = 'auto'
prefetcher.muted = true
let prefetchedUrl = ''

function maybePrefetchNext() {
  const s = usePlayerStore.getState()
  const idx = nextIndex(s.queue.length, s.currentIndex, s.repeat, true)
  if (idx === null || idx === s.currentIndex) return
  const next = s.queue[idx]
  // Only remote sources benefit; local tracks load instantly from IndexedDB.
  const url =
    next?.source === 'jamendo'
      ? next.jamendo?.audioUrl
      : next?.source === 'archive'
        ? next.archive?.audioUrl
        : undefined
  if (!url || url === prefetchedUrl) return
  prefetchedUrl = url
  prefetcher.src = url
  prefetcher.load()
}

// ---- returning to the foreground ----

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    // Background timers may have been throttled while we were away.
    usePlayerStore.getState().checkSleepTimer()
    // Mobile browsers suspend AudioContexts when backgrounded; bring ours back
    // so the equalizer keeps working after a return to the app.
    if (localStorage.getItem(FX_ENABLED_KEY) === '1' && active === audio) {
      void import('./audioFx').then((fx) => fx.resumeContext())
    }
  })
}

// ---- error toast plumbing (UI subscribes) ----

type TrackErrorListener = (track: Track) => void
const errorListeners = new Set<TrackErrorListener>()

export function onTrackError(listener: TrackErrorListener): () => void {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

function notifyTrackError(track: Track) {
  errorListeners.forEach((l) => l(track))
}

// ---- element events -> store sync (guarded so only the active element counts) ----

function wire(el: HTMLAudioElement) {
  el.addEventListener('play', () => {
    if (el === active) usePlayerStore.setState({ isPlaying: true })
  })
  el.addEventListener('pause', () => {
    if (el === active) usePlayerStore.setState({ isPlaying: false })
  })

  el.addEventListener('timeupdate', () => {
    if (el !== active) return
    // Media events keep firing while backgrounded even when timers are
    // throttled, so this is the reliable sleep-timer heartbeat on mobile.
    usePlayerStore.getState().checkSleepTimer()
    // Throttle to ~2 writes/sec; only SeekBar subscribes to positionSec.
    const now = performance.now()
    if (now - lastTimeWrite < 450) return
    lastTimeWrite = now
    usePlayerStore.setState({ positionSec: el.currentTime })
    if (
      Number.isFinite(el.duration) &&
      el.duration - el.currentTime < PREFETCH_THRESHOLD_SEC
    ) {
      maybePrefetchNext()
    }
  })

  el.addEventListener('loadedmetadata', () => {
    if (el !== active) return
    if (Number.isFinite(el.duration)) {
      usePlayerStore.setState({ durationSec: el.duration })
    }
    updatePositionState(el)
  })

  el.addEventListener('ended', () => {
    if (el !== active) return
    const s = usePlayerStore.getState()
    if (s.sleepAtTrackEnd) {
      usePlayerStore.setState({ sleepAtTrackEnd: false, isPlaying: false })
      return
    }
    s.next(true)
  })

  el.addEventListener('error', () => {
    if (el !== active) return
    // Stale events from a superseded load arrive as queued tasks after a new
    // src was set; by then the element's error state has been reset. Ignore
    // them — otherwise they'd skip a track that never failed.
    if (!el.error) return
    if (currentLoad && el.currentSrc && el.currentSrc !== currentLoad.url) return
    handleFailure(loadToken)
  })
}
