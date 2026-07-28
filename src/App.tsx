import { useCallback, useRef, useState } from 'react'
import { Routes, Route } from 'react-router'
import ShortcutsHelp from './components/common/ShortcutsHelp'
import Toaster from './components/common/Toaster'
import Sidebar from './components/layout/Sidebar'
import MobileTabBar from './components/layout/MobileTabBar'
import ScrollMemory from './components/layout/ScrollMemory'
import PlayerBar from './components/player/PlayerBar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Playlists from './pages/Playlists'
import PlaylistPage from './pages/PlaylistPage'
import SmartPlaylistPage from './pages/SmartPlaylistPage'
import Downloads from './pages/Downloads'
import Favorites from './pages/Favorites'
import Composers from './pages/Composers'
import ComposerPage from './pages/ComposerPage'
import Timeline from './pages/Timeline'
import QuizPage from './pages/QuizPage'
import Stats from './pages/Stats'
import WorkPage from './pages/WorkPage'
import BrowsePage from './pages/BrowsePage'
import CollectionPage from './pages/CollectionPage'
import Contemporary from './pages/Contemporary'

function App() {
  const [helpOpen, setHelpOpen] = useState(false)
  const toggleHelp = useCallback(() => setHelpOpen((o) => !o), [])
  useKeyboardShortcuts(toggleHelp)
  const mainRef = useRef<HTMLElement>(null)
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <ScrollMemory container={mainRef} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/composers" element={<Composers />} />
            <Route path="/composer/:slug" element={<ComposerPage />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/work/:id" element={<WorkPage />} />
            <Route path="/period/:slug" element={<BrowsePage mode="period" />} />
            <Route path="/form/:slug" element={<BrowsePage mode="form" />} />
            <Route path="/performer/:slug" element={<BrowsePage mode="performer" />} />
            <Route path="/instrument/:slug" element={<BrowsePage mode="instrument" />} />
            <Route path="/collection/:itemId" element={<CollectionPage />} />
            <Route path="/contemporary" element={<Contemporary />} />
            <Route path="/library" element={<Library />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:id" element={<PlaylistPage />} />
            <Route path="/smart/:id" element={<SmartPlaylistPage />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </main>
      </div>
      <PlayerBar />
      <MobileTabBar />
      <Toaster />
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

export default App
