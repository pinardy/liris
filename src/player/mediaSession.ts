import type { Track } from '../types/model'
import { resolveArtworkUrl } from './resolveSource'

/**
 * Media Session API wiring: lock-screen / media-key controls and metadata.
 * All calls feature-detect; no-ops on unsupported browsers.
 */

let lastArtworkObjectUrl: string | null = null
let handlersRegistered = false

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
    artwork: artworkUrl ? [{ src: artworkUrl, sizes: '512x512' }] : [],
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
  // Imported lazily at call time to avoid a module-init cycle with the store.
  void import('./playerStore').then(({ usePlayerStore }) => {
    const actions = () => usePlayerStore.getState()
    const ms = navigator.mediaSession
    ms.setActionHandler('play', () => actions().togglePlay())
    ms.setActionHandler('pause', () => actions().togglePlay())
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
  })
}
