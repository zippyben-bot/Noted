// Curated palettes. Each is a COMPLETE look — background neutrals + matching
// highlight — hand-tuned for light and dark. The theme mode (system/light/dark)
// selects which variant; `applyPalette` writes the whole token set onto :root
// (inline wins over the CSS defaults). Per-list dot colours are intentionally
// NOT themed here — they're semantic markers, defined once in index.css.

const TOKENS = {
  ground: '--ground',
  window: '--window',
  sidebar: '--sidebar',
  ink: '--ink',
  muted: '--muted',
  faint: '--faint',
  line: '--line',
  lineSoft: '--line-soft',
  accent: '--accent',
  accentInk: '--accent-ink',
  accentSoft: '--accent-soft'
}

export const PALETTES = [
  {
    id: 'classic', name: 'Classic',
    light: { ground: '#eeeff4', window: '#ffffff', sidebar: '#f4f5f9', ink: '#1b1d2b', muted: '#71748a', faint: '#a6a9bf', line: '#e7e8f0', lineSoft: '#eff0f6', accent: '#4b57e4', accentInk: '#ffffff', accentSoft: '#eceefc' },
    dark: { ground: '#080914', window: '#161930', sidebar: '#12142a', ink: '#e9ebf7', muted: '#969aba', faint: '#5e6386', line: '#262b48', lineSoft: '#1e2240', accent: '#7c87ff', accentInk: '#0d0f1c', accentSoft: '#20264a' }
  },
  {
    id: 'sand', name: 'Sand',
    light: { ground: '#f0ebe2', window: '#fbf8f3', sidebar: '#f2ede4', ink: '#2c2620', muted: '#7c7266', faint: '#b3a998', line: '#e7ded0', lineSoft: '#f0e9dd', accent: '#c2683c', accentInk: '#ffffff', accentSoft: '#f6e6da' },
    dark: { ground: '#17130e', window: '#221c15', sidebar: '#1b160f', ink: '#efe7db', muted: '#a99e8c', faint: '#6b6152', line: '#34291d', lineSoft: '#271f16', accent: '#e08a5a', accentInk: '#1a1206', accentSoft: '#3a2a1c' }
  },
  {
    id: 'forest', name: 'Forest',
    light: { ground: '#e8eee8', window: '#f7faf6', sidebar: '#eaf0e9', ink: '#1c261f', muted: '#6a7a6d', faint: '#a4b3a4', line: '#dbe5d9', lineSoft: '#eaf0e7', accent: '#2f7d54', accentInk: '#ffffff', accentSoft: '#dcefe1' },
    dark: { ground: '#0a120c', window: '#141d16', sidebar: '#101911', ink: '#e5efe6', muted: '#94a897', faint: '#5b6d5e', line: '#223528', lineSoft: '#18251a', accent: '#4fb37c', accentInk: '#08150c', accentSoft: '#143026' }
  },
  {
    id: 'slate', name: 'Slate',
    light: { ground: '#eaedf1', window: '#fbfcfe', sidebar: '#eef1f5', ink: '#1a1f28', muted: '#6a7382', faint: '#a3adba', line: '#e2e7ee', lineSoft: '#eef1f6', accent: '#2f6fed', accentInk: '#ffffff', accentSoft: '#e5edfd' },
    dark: { ground: '#0a0e15', window: '#151b25', sidebar: '#10151f', ink: '#e6ebf4', muted: '#93a0b4', faint: '#5a6577', line: '#253044', lineSoft: '#1a2233', accent: '#5b9bff', accentInk: '#06101f', accentSoft: '#182a45' }
  },
  {
    id: 'rose', name: 'Rose',
    light: { ground: '#f3eaed', window: '#fdf9fa', sidebar: '#f4ecef', ink: '#2a1f24', muted: '#83707a', faint: '#bda6b0', line: '#ecdde3', lineSoft: '#f5e9ee', accent: '#d43d6a', accentInk: '#ffffff', accentSoft: '#fbe1e9' },
    dark: { ground: '#140b0f', window: '#201319', sidebar: '#190f14', ink: '#f0e4ea', muted: '#ad97a2', faint: '#6e5560', line: '#351f28', lineSoft: '#26161d', accent: '#fb6f97', accentInk: '#1e0810', accentSoft: '#3e1826' }
  },
  {
    id: 'mono', name: 'Mono',
    light: { ground: '#ececec', window: '#ffffff', sidebar: '#f4f4f4', ink: '#1c1c1e', muted: '#71717a', faint: '#a8a8ad', line: '#e5e5e7', lineSoft: '#efeff0', accent: '#27272a', accentInk: '#ffffff', accentSoft: '#e4e4e7' },
    dark: { ground: '#0b0b0d', window: '#18181b', sidebar: '#121214', ink: '#f4f4f5', muted: '#9b9ba3', faint: '#5c5c63', line: '#2a2a2e', lineSoft: '#202023', accent: '#e4e4e7', accentInk: '#18181b', accentSoft: '#2b2b30' }
  }
]

export const DEFAULT_PALETTE = 'classic'

export function getVariant(id, isDark) {
  const p = PALETTES.find((x) => x.id === id) || PALETTES[0]
  return isDark ? p.dark : p.light
}

export function applyPalette(id, isDark) {
  const v = getVariant(id, isDark)
  const s = document.documentElement.style
  for (const [key, cssVar] of Object.entries(TOKENS)) s.setProperty(cssVar, v[key])
  // Tint the browser/OS chrome (mobile address bar, PWA title bar) to match the
  // app's base surface, so it blends seamlessly. The static manifest theme_color
  // is only a fallback / splash colour; this live-updates as palette or theme flips.
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', v.ground)
}
