import { useRef } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router'
import ErrorBoundary from './components/common/ErrorBoundary'
import { useUiStore } from './lib/uiStore'
import ShortcutsHelp from './components/common/ShortcutsHelp'
import Toaster from './components/common/Toaster'
import Sidebar from './components/layout/Sidebar'
import MobileTabBar from './components/layout/MobileTabBar'
import OfflineBanner from './components/layout/OfflineBanner'
import PwaUpdatePrompt from './components/layout/PwaUpdatePrompt'
import ScrollMemory from './components/layout/ScrollMemory'
import LaunchHandler from './components/layout/LaunchHandler'
import PlayerBar from './components/player/PlayerBar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Playlists from './pages/Playlists'
import PlaylistPage from './pages/PlaylistPage'
import SmartPlaylistPage from './pages/SmartPlaylistPage'
import Downloads from './pages/Downloads'
import History from './pages/History'
import Bookmarks from './pages/Bookmarks'
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
import NotFound from './pages/NotFound'
import Settings from './pages/Settings'

/** Shown in place of a page that threw; playback keeps running underneath. */
function PageErrorFallback(reset: () => void) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold">This page hit a bug</h1>
      <p className="mt-2 text-sm text-zinc-400">
        The music keeps playing — the rest of the app is fine. You can retry
        this page or head somewhere else.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          to="/"
          className="rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:border-white"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

function App() {
  const helpOpen = useUiStore((s) => s.helpOpen)
  const setHelpOpen = useUiStore((s) => s.setHelpOpen)
  useKeyboardShortcuts()
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  return (
    <div className="flex h-full flex-col">
      {/* Off-screen until focused: lets a keyboard user skip the nav, which is
          otherwise ~10 links to tab through on every page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black"
      >
        Skip to content
      </a>
      {/* Landscape notches eat into the sides; inset the whole content area. */}
      <div className="px-safe flex min-h-0 flex-1">
        <Sidebar />
        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto px-4 py-6 focus:outline-none md:px-8"
        >
          <ScrollMemory container={mainRef} />
          {/* Keyed by location so navigating away from a crashed page always
              gets a fresh boundary — the Go Home link works with no reset. */}
          <ErrorBoundary key={location.key} fallback={PageErrorFallback}>
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
            <Route path="/history" element={<History />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:id" element={<PlaylistPage />} />
            <Route path="/smart/:id" element={<SmartPlaylistPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <PwaUpdatePrompt />
      <OfflineBanner />
      <PlayerBar />
      <MobileTabBar />
      <Toaster />
      <LaunchHandler />
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

export default App
