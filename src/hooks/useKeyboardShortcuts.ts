import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { emitAppEvent } from '../lib/appEvents'
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

/** Every binding, in display order — the help sheet renders from this. */
export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Space', action: 'Play / pause' },
  { keys: '← / →', action: 'Seek 10 seconds back / forward' },
  { keys: '↑ / ↓', action: 'Volume up / down' },
  { keys: 'N / P', action: 'Next / previous track' },
  { keys: 'M', action: 'Mute' },
  { keys: 'S', action: 'Toggle shuffle' },
  { keys: 'R', action: 'Cycle repeat' },
  { keys: 'Q', action: 'Toggle queue' },
  { keys: '/', action: 'Search' },
  { keys: '?', action: 'This help' },
]

/** Global shortcuts. `onToggleHelp` opens/closes the shortcuts sheet ('?'). */
export function useKeyboardShortcuts(onToggleHelp: () => void): void {
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return

      // Key (not code) for the two layout-dependent ones.
      if (e.key === '?') {
        e.preventDefault()
        onToggleHelp()
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        void navigate('/search')
        // The input autofocuses on mount only; focus explicitly for the
        // already-on-the-page case.
        requestAnimationFrame(() =>
          document.querySelector<HTMLInputElement>('input[type="search"]')?.focus(),
        )
        return
      }

      if (e.shiftKey) return
      const state = usePlayerStore.getState()
      const hasTrack = state.currentIndex >= 0
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          state.togglePlay()
          break
        case 'ArrowRight':
          if (hasTrack) {
            e.preventDefault()
            state.seek(Math.min(state.positionSec + 10, state.durationSec))
          }
          break
        case 'ArrowLeft':
          if (hasTrack) {
            e.preventDefault()
            state.seek(Math.max(state.positionSec - 10, 0))
          }
          break
        case 'ArrowUp':
          if (hasTrack) {
            e.preventDefault()
            state.setVolume(state.volume + 0.05)
          }
          break
        case 'ArrowDown':
          if (hasTrack) {
            e.preventDefault()
            state.setVolume(state.volume - 0.05)
          }
          break
        case 'KeyN':
          if (hasTrack) state.next()
          break
        case 'KeyP':
          if (hasTrack) state.prev()
          break
        case 'KeyM':
          if (hasTrack) state.toggleMute()
          break
        case 'KeyS':
          state.toggleShuffle()
          break
        case 'KeyR':
          state.cycleRepeat()
          break
        case 'KeyQ':
          if (hasTrack) emitAppEvent('toggle-queue')
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, onToggleHelp])
}
