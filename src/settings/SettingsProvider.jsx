import { createContext, useContext, useEffect, useState } from 'react'
import { applyPalette, DEFAULT_PALETTE } from '../lib/palettes.js'

// Appearance settings: theme mode (system/light/dark) + palette (a complete
// background+highlight look). Both persist to localStorage and apply to :root.
// The palette is re-applied when the effective theme flips, since each palette
// has distinct light/dark token sets.

const THEME_KEY = 'noted:theme' // 'light' | 'dark' | absent(=system)
const PALETTE_KEY = 'noted:palette'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(THEME_KEY) || 'system')
  const [paletteId, setPaletteId] = useState(() => localStorage.getItem(PALETTE_KEY) || DEFAULT_PALETTE)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark = mode === 'system' ? systemDark : mode === 'dark'

  // theme mode → data-theme attribute (token CSS keys off this)
  useEffect(() => {
    const root = document.documentElement
    if (mode === 'system') {
      root.removeAttribute('data-theme')
      localStorage.removeItem(THEME_KEY)
    } else {
      root.setAttribute('data-theme', mode)
      localStorage.setItem(THEME_KEY, mode)
    }
  }, [mode])

  // palette → :root tokens (for the current effective theme)
  useEffect(() => {
    applyPalette(paletteId, isDark)
    localStorage.setItem(PALETTE_KEY, paletteId)
  }, [paletteId, isDark])

  const value = {
    mode,
    setMode,
    isDark,
    paletteId,
    setPalette: setPaletteId,
    toggleTheme: () => setMode(isDark ? 'light' : 'dark')
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
