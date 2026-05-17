import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import BetaGate from './components/BetaGate.jsx'

// Capture le prompt d'installation PWA dès qu'il se déclenche
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window._pwaInstallPrompt = e
})

// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BetaGate>
      <App />
    </BetaGate>
  </StrictMode>,
)
