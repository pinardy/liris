import { isSameWork } from '../lib/classical'
import { toast } from '../lib/toast'
import type { Track } from '../types/model'
import * as fx from './audioFx'
import {
  clearMediaSession,
  ensureMediaHandlers,
  setPlaybackState,
  updateMediaSession,
  updatePositionState,
} from './mediaSession'
import { usePlayerStore } from './playerStore'
import { nextIndex } from './queue'
import { resolvePlayableUrl } from './resolveSource'

/**
 * Singleton playback engine, living outside React. Commands come in from
 * playerStore actions; element events sync state back via setState.
 *
 * Three elements:
 * - `audio` / `audioAlt` alternate playing tracks. While one plays, the other
 *   is the *standby*: the upcoming track is resolved and buffered into it, so
 *   auto-advance swaps elements and plays instantly (near-gapless — vital for
 *   attacca movement transitions). When the equalizer is enabled, both are
 *   routed through the Web Audio graph, which requires crossOrigin CORS loads.
 * - `radioAudio` plays live radio streams. Radio redirects through hops
 *   without CORS headers, so it must stay OUT of the graph and load without
 *   crossOrigin — hence its own element. Radio therefore bypasses the EQ.
 */

const CROSSFADE_KEY = 'player-crossfade'
const CROSSFADE_MAX = 12

/** Crossfade duration in seconds (0 = off), clamped to a sane range. */
export function crossfadeSec(): number {
  const raw = Number(localStorage.getItem(CROSSFADE_KEY))
  return Number.isFinite(raw) ? Math.min(CROSSFADE_MAX, Math.max(0, raw)) : 0
}

export function setCrossfadeSec(secs: number): void {
  const clamped = Math.min(CROSSFADE_MAX, Math.max(0, Math.round(secs)))
  localStorage.setItem(CROSSFADE_KEY, String(clamped))
}

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
const audioAlt = createElement()
if (fx.isFxEnabled()) {
  audio.crossOrigin = 'anonymous'
  audioAlt.crossOrigin = 'anonymous'
}
let radioAudio: HTMLAudioElement | null = null
let active = audio
/** Whichever of the two main elements owns the current (non-radio) track. */
let mainActive = audio

// ---- crossfade state (see maybeCrossfade / startCrossfade) ----
/** True while two elements overlap during a crossfade; volume ramps own the
 *  element volumes for its duration, and re-entry is blocked. */
let crossfading = false
/** The element fading out during a crossfade, so pause/skip can stop it. */
let crossfadeOutgoing: HTMLAudioElement | null = null
let crossfadeOutgoingObjectUrl: string | null = null

function getRadioElement(): HTMLAudioElement {
  if (!radioAudio) radioAudio = createElement()
  return radioAudio
}

/** The two gapless elements (exposed for tests). */
export function getMainElements(): HTMLAudioElement[] {
  return [audio, audioAlt]
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
  /** Standby element that already buffered this track (the gapless path). */
  preloadedEl?: HTMLAudioElement
} | null = null

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function skipAfterError(track: Track) {
  // Offline, every remaining stream will fail the same way. Skipping through
  // them would burn the queue down and stack a near-identical toast per track,
  // so state the actual problem once and stop.
  if (isOffline()) {
    consecutiveErrors = 0
    // Forget the failed load: otherwise loadedTrackId() still reports this
    // track, and pressing Play after reconnecting would call play() on an
    // errored element instead of resolving the source again.
    currentLoad = null
    usePlayerStore.setState({ isPlaying: false, isLoading: false })
    notifyHalt("You're offline — only downloaded tracks can play.")
    return
  }
  toast(`Couldn't play “${track.title}” — skipped.`, { tone: 'error' })
  consecutiveErrors++
  const { queue } = usePlayerStore.getState()
  // Guard: if everything is failing, stop instead of skipping forever.
  if (consecutiveErrors >= Math.max(queue.length, 1) || consecutiveErrors >= 10) {
    consecutiveErrors = 0
    currentLoad = null // as above: let the next Play retry from scratch
    usePlayerStore.setState({ isLoading: false })
    notifyHalt("Playback stopped — those tracks couldn't be loaded.")
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

  // The retry exists for transient network hiccups; with no network at all
  // it just delays the real message by a second.
  if (!load.retried && !isOffline()) {
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
  const radio = isRadioTrack(load.track)
  const el = radio ? getRadioElement() : (load.preloadedEl ?? mainActive)
  if (el !== active) {
    active.pause()
    active.removeAttribute('src')
    active.load()
    active = el
  }
  if (!radio) mainActive = el
  // Equalizer graph must exist before play; created here so the AudioContext
  // is born inside a user-gesture call stack.
  if (!radio && fx.isFxEnabled()) {
    fx.ensureGraph(audio, audioAlt)
    fx.resumeContext()
  }
  // A preloaded standby already buffered this URL — assigning src again would
  // throw that buffer away. Retries reload deliberately.
  if (!load.preloadedEl || load.retried) el.src = load.url
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
      usePlayerStore.setState({ isPlaying: false, isLoading: false })
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
  // Any explicit load (manual skip, new play) supersedes an in-flight
  // crossfade — stop the outgoing element before taking over.
  finishCrossfade()
  const token = ++loadToken
  // Optimistic: the play button spins from the tap, not from the first byte.
  usePlayerStore.setState({ isLoading: true, bufferedSec: 0 })
  // Media keys must work from the moment a load starts, not only once audio
  // is rolling.
  ensureMediaHandlers()

  // Gapless path: the standby element already buffered this exact track, so
  // we skip resolution and start it directly with whatever it has buffered.
  if (standby && standby.track.id === track.id && !isRadioTrack(track)) {
    const { url, isObjectUrl } = standby
    const el = standbyElement()
    standby = null
    preloadToken++
    releaseObjectUrl()
    if (isObjectUrl) currentObjectUrl = url
    currentLoad = { token, track, url, retried: false, handled: false, preloadedEl: el }
    await attemptPlay(currentLoad)
    return
  }

  // Any other load makes the standby's content unpredictable — drop it.
  invalidateStandby()

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
async function reloadCurrentTrack(): Promise<void> {
  const s = usePlayerStore.getState()
  const track = s.queue[s.currentIndex]
  if (!track) return
  // The standby may hold this very track (repeat one) buffered in the old
  // CORS mode; a gapless swap onto it would play silence through the graph.
  invalidateStandby()
  const pos = active.currentTime
  await loadAndPlay(track)
  if (Number.isFinite(pos) && pos > 1 && !isRadioTrack(track)) seek(pos)
}

/** Turn the equalizer on: mark enabled, switch the elements to CORS loading,
 *  build the graph and reload the current track so it picks up the new mode.
 *  (A CORS-tainted source would output silence through the graph, so both
 *  gapless elements must switch modes together.) */
export async function enableEqualizer(): Promise<void> {
  fx.setFxEnabled(true)
  for (const el of [audio, audioAlt]) el.crossOrigin = 'anonymous'
  fx.ensureGraph(audio, audioAlt)
  fx.resumeContext()
  await reloadCurrentTrack()
}

/** Flatten gains and stop attaching the graph in future sessions. (The graph
 *  can't be detached from the element within this session.) */
export function disableEqualizer(): void {
  fx.setFxEnabled(false)
  fx.resetGains()
}

/** Id of the track the engine currently has loaded, or null before any load.
 *  Lets the store detect a restored-but-not-loaded session on resume. */
export function loadedTrackId(): string | null {
  return currentLoad?.track.id ?? null
}

/**
 * Full teardown for an emptied queue: stop audio, forget the loaded track and
 * clear the lock-screen entry, which would otherwise keep showing a track the
 * user just removed.
 */
export function stop(): void {
  finishCrossfade()
  loadToken++
  invalidateStandby()
  active.pause()
  active.removeAttribute('src')
  active.load()
  releaseObjectUrl()
  currentLoad = null
  usePlayerStore.setState({ isLoading: false, bufferedSec: 0 })
  clearMediaSession()
}

export function play(): void {
  if (fx.isFxEnabled() && active !== radioAudio) fx.resumeContext()
  active.play().catch(() => usePlayerStore.setState({ isPlaying: false }))
}

export function pause(): void {
  active.pause()
  // Pausing during an initial load fires no 'pause' event (nothing was
  // playing) but must still stop the loading spinner.
  usePlayerStore.setState({ isLoading: false })
  // A pause mid-crossfade must silence the outgoing element too, then abandon
  // the crossfade so a later resume plays only the current track.
  if (crossfading) finishCrossfade()
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

/** 1 = normal; ramped toward 0 by the sleep timer's final fade. */
let sleepFade = 1

/**
 * Playback speed for the main elements (practice tool). Radio stays at 1× —
 * live streams have no buffered future to stretch. Applied to BOTH gapless
 * elements so an element swap keeps the chosen speed. `preservePitch` keeps
 * the pitch constant while stretching time; turned off, slowing also lowers
 * pitch like a turntable (≈0.944× approximates baroque A415 tuning).
 */
export function setPlaybackRate(rate: number, preservePitch: boolean): void {
  for (const el of [audio, audioAlt]) {
    el.preservesPitch = preservePitch
    // Loading a new src resets playbackRate to defaultPlaybackRate, so the
    // default must carry the chosen speed or every track change would snap
    // back to 1×.
    el.defaultPlaybackRate = rate
    el.playbackRate = rate
  }
  if (active !== radioAudio) updatePositionState(active)
}

export function setVolume(volume: number, muted: boolean): void {
  // While crossfading, the ramps own each element's volume; syncing to the
  // user level here would jump both elements. applyVolume re-syncs when done.
  if (crossfading) return
  for (const el of [audio, audioAlt, radioAudio]) {
    if (!el) continue
    el.volume = volume * sleepFade
    el.muted = muted
  }
}

/** Scale playback volume without touching the user's volume setting. */
export function setSleepFade(factor: number): void {
  sleepFade = Math.min(1, Math.max(0, factor))
  applyVolume()
}

function applyVolume() {
  const { volume, muted } = usePlayerStore.getState()
  setVolume(volume, muted)
}

// ---- gapless: standby preload of the upcoming track ----

/** The main element not currently playing; the next track buffers here. */
function standbyElement(): HTMLAudioElement {
  return mainActive === audio ? audioAlt : audio
}

let standby: { track: Track; url: string; isObjectUrl: boolean } | null = null
let preloadToken = 0

function invalidateStandby() {
  preloadToken++
  if (standby) {
    if (standby.isObjectUrl) URL.revokeObjectURL(standby.url)
    standby = null
  }
  const el = standbyElement()
  if (el !== active && el.src) {
    el.removeAttribute('src')
    el.load()
  }
}

/**
 * Resolve and buffer the upcoming track on the standby element so
 * auto-advance can swap elements and play instantly instead of resolving and
 * fetching at the boundary. Best-effort: any failure just means the advance
 * falls back to the ordinary load-on-demand path.
 */
async function preloadNext() {
  const s = usePlayerStore.getState()
  const idx = nextIndex(s.queue.length, s.currentIndex, s.repeat, true)
  if (idx === null) return
  const next = s.queue[idx]
  if (!next || isRadioTrack(next)) return
  if (standby?.track.id === next.id) return
  const token = ++preloadToken
  try {
    const resolved = await resolvePlayableUrl(next)
    if (token !== preloadToken) {
      if (resolved.isObjectUrl) URL.revokeObjectURL(resolved.url)
      return
    }
    if (standby?.isObjectUrl) URL.revokeObjectURL(standby.url)
    standby = { track: next, ...resolved }
    const el = standbyElement()
    el.preload = 'auto'
    el.src = resolved.url
    el.load()
  } catch {
    // Leave the standby empty; the boundary will resolve normally.
  }
}

// ---- crossfade across works (opt-in) ----

/**
 * Near the end of a non-radio track, if crossfade is enabled and the next
 * track belongs to a DIFFERENT work, overlap the already-buffered standby
 * element and ramp between them. Movements within one work stay gapless.
 * Any failed precondition falls back to the ordinary end-of-track advance.
 */
function maybeCrossfade() {
  if (crossfading || active === radioAudio) return
  const secs = crossfadeSec()
  if (secs <= 0 || !Number.isFinite(active.duration)) return
  const remaining = active.duration - active.currentTime
  if (remaining <= 0 || remaining > secs) return
  const s = usePlayerStore.getState()
  if (s.repeat === 'one') return
  const idx = nextIndex(s.queue.length, s.currentIndex, s.repeat, true)
  if (idx === null || idx === s.currentIndex) return
  const current = s.queue[s.currentIndex]
  const next = s.queue[idx]
  if (!current || !next || isRadioTrack(next)) return
  // Movement-to-movement within one work must stay gapless, not crossfade.
  if (isSameWork(current, next)) return
  // Only when the next track is already buffered on the standby element;
  // otherwise let the ordinary advance resolve and load it.
  if (!standby || standby.track.id !== next.id) return
  startCrossfade(secs, idx)
}

function startCrossfade(secs: number, nextIdx: number) {
  const buffered = standby
  if (!buffered) return
  const outgoing = active
  const el = standbyElement()

  // Take over the standby buffer as the new active element.
  crossfadeOutgoing = outgoing
  crossfadeOutgoingObjectUrl = currentObjectUrl
  currentObjectUrl = buffered.isObjectUrl ? buffered.url : null
  standby = null
  preloadToken++
  crossfading = true

  const token = ++loadToken
  active = el
  mainActive = el
  currentLoad = {
    token,
    track: buffered.track,
    url: buffered.url,
    retried: false,
    handled: false,
    preloadedEl: el,
  }

  if (fx.isFxEnabled()) {
    fx.ensureGraph(audio, audioAlt)
    fx.resumeContext()
  }

  const { volume, muted } = usePlayerStore.getState()
  const target = muted ? 0 : volume * sleepFade
  el.currentTime = 0
  el.muted = false
  el.volume = 0
  void el
    .play()
    .then(() => void updateMediaSession(buffered.track))
    .catch(() => {})

  // Show the new track immediately, without re-loading it in the engine.
  usePlayerStore.getState().crossfadeAdvance(nextIdx)

  rampVolume(el, 0, target, secs)
  rampVolume(outgoing, outgoing.volume, 0, secs, finishCrossfade)
  // rAF ramps freeze when the tab is hidden, so guarantee cleanup regardless.
  setTimeout(finishCrossfade, secs * 1000 + 300)
}

/** End a crossfade: stop the outgoing element and re-sync volume. Idempotent. */
function finishCrossfade() {
  if (!crossfading) return
  crossfading = false
  const out = crossfadeOutgoing
  crossfadeOutgoing = null
  if (out && out !== active) {
    out.pause()
    out.removeAttribute('src')
    out.load()
  }
  if (crossfadeOutgoingObjectUrl) {
    URL.revokeObjectURL(crossfadeOutgoingObjectUrl)
    crossfadeOutgoingObjectUrl = null
  }
  applyVolume()
}

/** Linearly ramp an element's volume from `from` to `to` over `secs`, via rAF. */
function rampVolume(
  el: HTMLAudioElement,
  from: number,
  to: number,
  secs: number,
  onDone?: () => void,
) {
  const startMs = performance.now()
  const durMs = Math.max(1, secs * 1000)
  function step(now: number) {
    const t = Math.min(1, (now - startMs) / durMs)
    el.volume = Math.min(1, Math.max(0, from + (to - from) * t))
    if (t < 1) requestAnimationFrame(step)
    else onDone?.()
  }
  requestAnimationFrame(step)
}

// ---- returning to the foreground ----

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    // Background timers may have been throttled while we were away.
    usePlayerStore.getState().checkSleepTimer()
    // Mobile browsers suspend AudioContexts when backgrounded; bring ours back
    // so the equalizer keeps working after a return to the app.
    if (fx.isFxEnabled() && active !== radioAudio) fx.resumeContext()
  })
}

/** Playback gave up rather than skipping on: this needs longer on screen
 *  than a per-track notice, because nothing is playing now. */
function notifyHalt(message: string) {
  toast(message, { tone: 'error', durationMs: 7000 })
}

// ---- element events -> store sync (guarded so only the active element counts) ----

/** Push the end of the buffered range around the playhead into the store, so
 *  the seek bar can paint how far ahead is safe to scrub. */
function writeBuffered(el: HTMLAudioElement) {
  if (el !== active) return
  let end = 0
  try {
    const ranges = el.buffered
    const t = el.currentTime
    for (let i = 0; i < ranges.length; i++) {
      // Only the range the playhead sits in (slack for range rounding).
      if (ranges.start(i) <= t + 1 && t <= ranges.end(i) + 1 && ranges.end(i) > end) {
        end = ranges.end(i)
      }
    }
  } catch {
    return // some environments stub media elements without TimeRanges
  }
  // Only meaningful movement — this can fire many times a second.
  if (Math.abs(end - usePlayerStore.getState().bufferedSec) > 1) {
    usePlayerStore.setState({ bufferedSec: end })
  }
}

function wire(el: HTMLAudioElement) {
  el.addEventListener('play', () => {
    if (el !== active) return
    usePlayerStore.setState({ isPlaying: true })
    setPlaybackState('playing')
  })
  el.addEventListener('pause', () => {
    if (el !== active) return
    usePlayerStore.setState({ isPlaying: false, isLoading: false })
    // A pause fired by stop() arrives after the session was cleared (the
    // event is queued, not synchronous); with nothing loaded there is no
    // transport to describe, so leave the media session torn down.
    if (currentLoad) setPlaybackState('paused')
  })
  // Buffering feedback: 'waiting' = starved mid-track, 'playing' = audio is
  // genuinely rolling, 'canplay' = enough data while paused (e.g. after a
  // seek). Together they bound every spinner the UI shows.
  el.addEventListener('waiting', () => {
    if (el === active) usePlayerStore.setState({ isLoading: true })
  })
  el.addEventListener('playing', () => {
    if (el === active) usePlayerStore.setState({ isLoading: false })
  })
  el.addEventListener('canplay', () => {
    if (el === active) usePlayerStore.setState({ isLoading: false })
  })
  el.addEventListener('progress', () => writeBuffered(el))

  el.addEventListener('timeupdate', () => {
    if (el !== active) return
    // Media events keep firing while backgrounded even when timers are
    // throttled, so this is the reliable sleep-timer heartbeat on mobile.
    usePlayerStore.getState().checkSleepTimer()
    // Checked every tick (not throttled) so the fade starts on time near the end.
    maybeCrossfade()
    // Throttle to ~2 writes/sec; only SeekBar subscribes to positionSec.
    const now = performance.now()
    if (now - lastTimeWrite < 450) return
    lastTimeWrite = now
    usePlayerStore.setState({ positionSec: el.currentTime })
    writeBuffered(el)
    if (
      Number.isFinite(el.duration) &&
      el.duration - el.currentTime < PREFETCH_THRESHOLD_SEC
    ) {
      void preloadNext()
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
    if (s.sleepTimer?.kind === 'track-end') {
      usePlayerStore.setState({ sleepTimer: null, isPlaying: false })
      return
    }
    if (s.sleepTimer?.kind === 'work-end') {
      const idx = nextIndex(s.queue.length, s.currentIndex, s.repeat, true)
      const current = s.queue[s.currentIndex]
      const upcoming = idx === null ? undefined : s.queue[idx]
      // The work is over when nothing follows, when the next track belongs to
      // a different work, or under repeat-one (that work would never end).
      if (
        !current ||
        !upcoming ||
        idx === s.currentIndex ||
        !isSameWork(current, upcoming)
      ) {
        usePlayerStore.setState({ sleepTimer: null, isPlaying: false })
        return
      }
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
