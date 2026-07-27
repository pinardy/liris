import { Routes, Route } from 'react-router'
import Toaster from './components/common/Toaster'
import Sidebar from './components/layout/Sidebar'
import MobileTabBar from './components/layout/MobileTabBar'
import PlayerBar from './components/player/PlayerBar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Playlists from './pages/Playlists'
import PlaylistPage from './pages/PlaylistPage'
import Favorites from './pages/Favorites'
import AlbumPage from './pages/AlbumPage'
import ArtistPage from './pages/ArtistPage'
import ArchiveAlbumPage from './pages/ArchiveAlbumPage'
import GenrePage from './pages/GenrePage'

function App() {
  useKeyboardShortcuts()
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:id" element={<PlaylistPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/genre/:tag" element={<GenrePage />} />
            <Route path="/genre/:tag/:sub" element={<GenrePage />} />
            <Route path="/archive/:itemId" element={<ArchiveAlbumPage />} />
          </Routes>
        </main>
      </div>
      <PlayerBar />
      <MobileTabBar />
      <Toaster />
    </div>
  )
}

export default App
