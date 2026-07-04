import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { useSettings } from '../settings/SettingsProvider.jsx'
import { PALETTES, getVariant } from '../lib/palettes.js'
import { exportData, importData } from '../lib/backup.js'

const THEME_MODES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' }
]

export default function SettingsModal({ onClose }) {
  const { mode, setMode, paletteId, setPalette, isDark } = useSettings()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null) // { file, name } awaiting import confirm
  const [status, setStatus] = useState(null)

  // close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onExport = async () => {
    const r = await exportData()
    setStatus(`Exported ${r.tasks} tasks across ${r.lists} lists.`)
  }

  const onPickFile = (e) => {
    const file = e.target.files?.[0]
    if (file) setPending({ file, name: file.name })
    e.target.value = '' // allow re-picking the same file later
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,12,24,0.45)] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-2xl border border-line bg-window shadow-window"
      >
        {/* header */}
        <div className="flex items-center gap-2 border-b border-line-soft px-5 py-3.5">
          <h2 className="flex-1 text-[0.95rem] font-[620] text-ink">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:text-ink"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* theme */}
          <div className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">
            Theme
          </div>
          <div className="flex gap-1 rounded-xl bg-sidebar p-1">
            {THEME_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-[0.85rem] font-medium transition-colors ${
                  mode === m.id
                    ? 'bg-window text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* palette */}
          <div className="mb-2 mt-6 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">
            Palette
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {PALETTES.map((p) => {
              const selected = p.id === paletteId
              const v = getVariant(p.id, isDark) // preview in the current theme
              return (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  aria-label={p.name}
                  aria-pressed={selected}
                  className="relative rounded-xl border-2 p-3 text-left transition-transform hover:scale-[1.02]"
                  style={{
                    background: v.window,
                    borderColor: selected ? v.accent : v.line,
                    color: v.ink
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 flex-none rounded-full" style={{ background: v.accent }} />
                    <span className="text-[0.95rem] font-[620]">Aa</span>
                    {selected && (
                      <span className="ml-auto" style={{ color: v.accent }}>
                        <Icon name="check" size={15} strokeWidth={3.5} />
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-[0.78rem]" style={{ color: v.muted }}>
                    {p.name}
                  </div>
                </button>
              )
            })}
          </div>
          {/* data (backup / restore) */}
          <div className="mb-2 mt-6 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">
            Data
          </div>
          {pending ? (
            <div className="rounded-lg border border-line bg-sidebar p-3 text-[0.82rem]">
              <div className="text-ink">
                Replace all current data with <b>{pending.name}</b>?
              </div>
              <div className="mt-1 text-muted">This overwrites your existing lists and tasks.</div>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={doImport}
                  className="rounded-md bg-accent px-3 py-1.5 text-[0.8rem] font-semibold text-accent-ink"
                >
                  Import &amp; replace
                </button>
                <button
                  onClick={() => setPending(null)}
                  className="rounded-md px-3 py-1.5 text-[0.8rem] text-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onExport}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[0.82rem] text-ink hover:border-faint"
              >
                <Icon name="download" size={15} className="text-muted" /> Export
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[0.82rem] text-ink hover:border-faint"
              >
                <Icon name="upload" size={15} className="text-muted" /> Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={onPickFile}
                className="hidden"
              />
            </div>
          )}
          {status && <div className="mt-2 text-[0.75rem] text-muted">{status}</div>}
        </div>

        <div className="border-t border-line-soft px-5 py-3 text-[0.72rem] text-faint">
          blunderlist · saved on this device
        </div>
      </div>
    </div>
  )
}
