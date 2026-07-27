import { useEffect } from 'react'
import { usePlayerStore } from '../player/playerStore'

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  )
}

/** Global playback shortcuts: Space = play/pause, ←/→ = seek ±10s. */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      const state = usePlayerStore.getState()
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          state.togglePlay()
          break
        case 'ArrowRight':
          if (state.currentIndex >= 0) {
            e.preventDefault()
            state.seek(Math.min(state.positionSec + 10, state.durationSec))
          }
          break
        case 'ArrowLeft':
          if (state.currentIndex >= 0) {
            e.preventDefault()
            state.seek(Math.max(state.positionSec - 10, 0))
          }
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
