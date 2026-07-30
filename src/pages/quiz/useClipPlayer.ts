import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../player/playerStore'

export const CLIP_SEC = 20

/**
 * A self-contained audio element for the quiz's blind clips, kept separate
 * from the real player so the now-playing UI never spoils the answer. Each
 * clip drops in somewhere past the opening (openings are too recognisable),
 * stays muted until the seek lands, plays ~CLIP_SEC seconds, and reports
 * progress 0→1. `onError` fires only on a genuine media failure — the caller
 * swaps in a spare work.
 */
export function useClipPlayer(onError: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clipStartRef = useRef<number | null>(null)
  // Listeners bind once but must call the latest handler; refresh it via an
  // effect rather than mutating a ref during render.
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = new Audio()
    el.preload = 'auto'
    audioRef.current = el

    el.addEventListener('loadedmetadata', () => {
      const start =
        Number.isFinite(el.duration) && el.duration > CLIP_SEC * 3
          ? Math.min(el.duration * 0.3, el.duration - CLIP_SEC - 2)
          : 0
      clipStartRef.current = start
      if (start > 0) el.currentTime = start
      else el.muted = false
    })
    el.addEventListener('seeked', () => {
      el.muted = false
    })
    el.addEventListener('timeupdate', () => {
      const start = clipStartRef.current
      if (start === null) return
      const t = (el.currentTime - start) / CLIP_SEC
      setProgress(Math.min(1, Math.max(0, t)))
      if (t >= 1 && !el.paused) el.pause()
    })
    el.addEventListener('ended', () => setProgress(1))
    el.addEventListener('error', () => {
      if (el.error) onErrorRef.current()
    })

    return () => {
      el.pause()
      el.removeAttribute('src')
      audioRef.current = null
    }
  }, [])

  /** Load and start a clip from the given URL. */
  const play = useCallback((url: string) => {
    const el = audioRef.current
    if (!el) return
    // The main player must not compete with the quiz.
    const player = usePlayerStore.getState()
    if (player.isPlaying) player.togglePlay()

    setProgress(0)
    clipStartRef.current = null
    el.muted = true
    el.volume = player.muted ? 0 : player.volume
    el.src = url
    el.play().catch(() => {
      // Superseded loads also reject their play() promise; only a load with a
      // real media error should trigger the spare-work swap.
      if (el.error) onErrorRef.current()
    })
  }, [])

  /** Restart the current clip from its drop-in point. */
  const replay = useCallback(() => {
    const el = audioRef.current
    if (!el || clipStartRef.current === null) return
    el.currentTime = clipStartRef.current
    setProgress(0)
    void el.play().catch(() => {})
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  return { progress, play, replay, pause }
}
