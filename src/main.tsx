import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { initSessionPersistence } from './player/sessionPersistence'

// Fire-and-forget: restores the previous queue/position, then keeps saving.
void initSessionPersistence()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BASE_URL keeps routing correct under the GitHub Pages subpath. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
