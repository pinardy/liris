import type { Track } from '../types/model'
import { usePlayerStore } from './playerStore'
import { resolveArtworkUrl } from './resolveSource'

/**
 * Media Session API wiring: lock-screen / media-key controls and metadata.
 * All calls feature-detect; no-ops on unsupported browsers.
 */

let lastArtworkObjectUrl: string | null = null
let handlersRegistered = false

/**
 * Register the media-key/lock-screen handlers. Safe to call repeatedly, and
 * called BEFORE the first successful play (from a load, and after a session
 * restore) — otherwise hardware keys are dead until audio has already
 * started, which is exactly when a user reaches for them.
 */
export function ensureMediaHandlers(): void {
  if (!('mediaSession' in navigator)) return
  registerHandlers()
}

/** Mirror the real transport state; without this, several platforms draw the
 *  wrong play/pause glyph on the lock screen. */
export function setPlaybackState(state: MediaSessionPlaybackState): void {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.playbackState = state
}

/** Drop the lock-screen entry entirely (the queue was emptied). */
export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = null
  navigator.mediaSession.playbackState = 'none'
  if (lastArtworkObjectUrl) {
    URL.revokeObjectURL(lastArtworkObjectUrl)
    lastArtworkObjectUrl = null
  }
}

export async function updateMediaSession(track: Track): Promise<void> {
  if (!('mediaSession' in navigator)) return
  registerHandlers()

  const artworkUrl = await resolveArtworkUrl(track)
  // Revoke the previous local artwork object URL, if any.
  if (lastArtworkObjectUrl) {
    URL.revokeObjectURL(lastArtworkObjectUrl)
    lastArtworkObjectUrl = null
  }
  if (artworkUrl?.startsWith('blob:')) lastArtworkObjectUrl = artworkUrl

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album ?? '',
    // No `sizes`: the real dimensions are unknown here, and claiming 512×512
    // for a smaller image makes platforms upscale it badly.
    artwork: artworkUrl ? [{ src: artworkUrl }] : [],
  })
}

export function updatePositionState(audio: HTMLAudioElement): void {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return
  navigator.mediaSession.setPositionState({
    duration: audio.duration,
    playbackRate: audio.playbackRate,
    position: Math.min(audio.currentTime, audio.duration),
  })
}

function registerHandlers(): void {
  if (handlersRegistered) return
  handlersRegistered = true
  const actions = () => usePlayerStore.getState()
  const ms = navigator.mediaSession
  // Explicitly directional, never a toggle: the OS can send a duplicate
  // 'play' (headset resume, end of a call, some Android ROMs), and a
  // toggling handler would pause the music instead.
  ms.setActionHandler('play', () => {
    const s = actions()
    if (!s.isPlaying) s.togglePlay()
  })
  ms.setActionHandler('pause', () => {
    const s = actions()
    if (s.isPlaying) s.togglePlay()
  })
  ms.setActionHandler('stop', () => {
    const s = actions()
    if (s.isPlaying) s.togglePlay()
  })
  ms.setActionHandler('previoustrack', () => actions().prev())
  ms.setActionHandler('nexttrack', () => actions().next())
  ms.setActionHandler('seekto', (e) => {
    if (typeof e.seekTime === 'number') actions().seek(e.seekTime)
  })
  ms.setActionHandler('seekbackward', (e) => {
    actions().seek(Math.max(0, actions().positionSec - (e.seekOffset ?? 10)))
  })
  ms.setActionHandler('seekforward', (e) => {
    actions().seek(actions().positionSec + (e.seekOffset ?? 10))
  })
}
