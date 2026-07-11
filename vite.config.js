import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Noted List — local-first checklist PWA.
// Served in production under benford.co.nz/notedlist, so the production build
// uses base '/notedlist/' and emits into dist/notedlist (URLs match physical
// paths on Vercel). Dev stays at '/' so local testing is unaffected.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/notedlist/' : '/',
  build: { outDir: 'dist/notedlist', emptyOutDir: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script', // external registerSW.js (no inline script → CSP-safe)
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
}))
