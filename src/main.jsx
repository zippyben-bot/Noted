import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { StoreProvider } from './store/StoreProvider.jsx'
import { SettingsProvider } from './settings/SettingsProvider.jsx'
import './index.css'

// keep the installed app up to date automatically
registerSW({ immediate: true })

// Ask the browser to keep our IndexedDB data durable (not evicted under storage
// pressure). Best-effort; granted silently for installed PWAs.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </SettingsProvider>
  </StrictMode>
)
