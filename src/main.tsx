import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import { initStabilityNets } from './lib/stability'
import { initSessionPersistence } from './player/sessionPersistence'

initStabilityNets()

// Fire-and-forget: restores the previous queue/position, then keeps saving.
void initSessionPersistence()

/** Last-resort screen; router-free because the crash may be in the router. */
function appCrashScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-bold text-white">Liris hit a problem</h1>
      <p className="max-w-sm text-sm text-zinc-400">
        Reloading usually fixes this. Your library, playlists and downloads are
        stored on this device and are not affected.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black"
      >
        Reload
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={appCrashScreen}>
      {/* BASE_URL keeps routing correct under the GitHub Pages subpath. */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
