import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { useSettings } from '../settings/SettingsProvider.jsx'
import { PALETTES, getVariant } from '../lib/palettes.js'
import { exportData, importData } from '../lib/backup.js'

const THEME_MODES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' }
]

// Palette preview: a mini mock of the app — sidebar + window + accent — so you
// see the palette in context rather than as abstract swatches.
function PaletteCard({ p, v, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="relative rounded-xl border-2 p-2.5 text-left transition-transform hover:scale-[1.02]"
      style={{ background: v.ground, borderColor: selected ? v.accent : v.line }}
    >
      <div className="flex h-[52px] overflow-hidden rounded-lg" style={{ border: `1px solid ${v.line}` }}>
        <div className="w-[34%] p-1.5" style={{ background: v.sidebar }}>
          <span className="block h-1.5 w-1.5 rounded-full" style={{ background: v.accent }} />
          <span className="mt-1.5 block h-1 w-full rounded" style={{ background: v.faint }} />
          <span className="mt-1 block h-1 w-3/4 rounded" style={{ background: v.faint }} />
        </div>
        <div className="flex-1 space-y-1.5 p-1.5" style={{ background: v.window }}>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ border: `1.5px solid ${v.accent}`, background: v.accentSoft }} />
            <span className="h-1.5 flex-1 rounded" style={{ background: v.ink }} />
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ border: `1.5px solid ${v.faint}` }} />
            <span className="h-1.5 w-2/3 rounded" style={{ background: v.muted }} />
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[0.8rem] font-[560]" style={{ color: v.ink }}>{p.name}</span>
        {selected && (
          <span style={{ color: v.accent }}><Icon name="check" size={15} strokeWidth={3.5} /></span>
        )}
      </div>
    </button>
  )
}

export default function SettingsPage({ onClose }) {
  const { mode, setMode, paletteId, setPalette, isDark } = useSettings()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [status, setStatus] = useState(null)

  const onExport = async () => {
    const r = await exportData()
    setStatus(`Exported ${r.tasks} tasks across ${r.lists} lists.`)
  }
  const onPickFile = (e) => {
    const file = e.target.files?.[0]
    if (file) setPending({ file, name: file.name })
    e.target.value = ''
  }
  const doImport = async () => {
    try {
      const r = await importData(pending.file)
      setPending(null)
      setStatus(`Imported ${r.tasks} tasks. Reloading…`)
      setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      setPending(null)
      setStatus(err.message)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-window">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-line-soft px-5 py-2.5">
        <button
          onClick={onClose}
          title="Back"
          aria-label="Back"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:text-ink"
        >
          <Icon name="x" size={18} />
        </button>
        <h1 className="flex-1 text-[0.95rem] font-[620] text-ink">Settings</h1>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-[620px]">
          {/* theme */}
          <div className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">Theme</div>
          <div className="flex max-w-[320px] gap-1 rounded-xl bg-sidebar p-1">
            {THEME_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-[0.85rem] font-medium transition-colors ${
                  mode === m.id ? 'bg-window text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* palette */}
          <div className="mb-2 mt-7 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">
            Palette
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PALETTES.map((p) => (
              <PaletteCard
                key={p.id}
                p={p}
                v={getVariant(p.id, isDark)}
                selected={p.id === paletteId}
                onClick={() => setPalette(p.id)}
              />
            ))}
          </div>

          {/* data */}
          <div className="mb-2 mt-7 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">Data</div>
          {pending ? (
            <div className="max-w-[420px] rounded-lg border border-line bg-sidebar p-3 text-[0.82rem]">
              <div className="text-ink">Replace all current data with <b>{pending.name}</b>?</div>
              <div className="mt-1 text-muted">This overwrites your existing lists and tasks.</div>
              <div className="mt-2.5 flex gap-2">
                <button onClick={doImport} className="rounded-md bg-accent px-3 py-1.5 text-[0.8rem] font-semibold text-accent-ink">
                  Import &amp; replace
                </button>
                <button onClick={() => setPending(null)} className="rounded-md px-3 py-1.5 text-[0.8rem] text-muted hover:text-ink">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onExport} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[0.82rem] text-ink hover:border-faint">
                <Icon name="download" size={15} className="text-muted" /> Export
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[0.82rem] text-ink hover:border-faint">
                <Icon name="upload" size={15} className="text-muted" /> Import
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPickFile} className="hidden" />
            </div>
          )}
          {status && <div className="mt-2 text-[0.75rem] text-muted">{status}</div>}

          <div className="mt-8 border-t border-line-soft pt-3 text-[0.72rem] text-faint">
            Noted · saved on this device
          </div>
        </div>
      </div>
    </div>
  )
}
