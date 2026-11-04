import { create } from 'zustand'

/**
 * App-level UI surfaces that more than one component needs to open: the
 * shortcuts sheet (Sidebar, Settings, the '?' key) and the queue panel
 * (PlayerBar, the 'Q' key). A store instead of prop drilling or an event bus,
 * so any caller can read and set them directly.
 */
interface UiState {
  helpOpen: boolean
  queueOpen: boolean
  setHelpOpen: (open: boolean) => void
  toggleHelp: () => void
  setQueueOpen: (open: boolean) => void
  toggleQueue: () => void
}

export const useUiStore = create<UiState>((set) => ({
  helpOpen: false,
  queueOpen: false,
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  toggleHelp: () => set((s) => ({ helpOpen: !s.helpOpen })),
  setQueueOpen: (queueOpen) => set({ queueOpen }),
  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
}))
