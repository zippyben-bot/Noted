import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Noted List — local-first checklist PWA.
// display: standalone → installs to the Dock and opens in its own chrome-free window.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Make the dev server installable too, so the Dock app can point at it
      // and pick up live changes (hot-reload) instead of a frozen build.
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Noted List',
        short_name: 'Noted List',
        description: 'A lightweight, local-first checklist app.',
        display: 'standalone',
        background_color: '#0d0f1c',
        theme_color: '#4b57e4',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      }
    })
  ]
})
