import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Noted — local-first checklist PWA.
// Hosted on Cloudflare Pages at its own subdomain (noted.benford.co.nz),
// so it serves from the root — base '/'. Security headers + SPA fallback live
// in public/_headers and public/_redirects (Cloudflare Pages picks them up).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script', // external registerSW.js (no inline script → CSP-safe)
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Noted',
        short_name: 'Noted',
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
