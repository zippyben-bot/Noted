import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import Icon from './Icon.jsx'
import { useLists } from '../store/StoreProvider.jsx'
import { useSettings } from '../settings/SettingsProvider.jsx'
import { useInstallPrompt } from '../lib/useInstallPrompt.js'

const dotVar = (color) => `var(--dot-${color})`

// Droppable id convention for list rows (a task dragged here moves to it).
export const listDropId = (listId) => `list:${listId}`

// Wraps a list row so a dragged task can be dropped on it. Highlights on hover.
function DroppableRow({ listId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: listDropId(listId) })
  return (
    <div ref={setNodeRef} className={`rounded-lg ${isOver ? 'ring-2 ring-inset ring-accent' : ''}`}>
      {children}
    </div>
  )
}

export default function Sidebar({ settingsActive, onOpenSettings }) {
  const { lists, activeListId, openCounts, selectList, addList, renameList, deleteList } = useLists()
  const { isDark, toggleTheme } = useSettings()
  const { canInstall, canPrompt, isIOS, promptInstall } = useInstallPrompt()
  const [iosHint, setIosHint] = useState(false)

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const commitNew = () => {
    if (newName.trim()) addList(newName)
    setNewName('')
    setAdding(false)
  }

  const commitRename = (id) => {
    if (editName.trim()) renameList(id, editName)
    setEditingId(null)
  }

  return (
    <aside className="flex w-60 flex-none flex-col border-r border-line bg-sidebar">
      {/* brand */}
      <div className="flex items-center gap-2.5 px-[18px] pb-3.5 pt-[18px]">
        <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-lg bg-accent text-accent-ink">
          <Icon name="check" size={15} strokeWidth={3.2} />
        </span>
        <span className="text-[1.06rem] font-bold tracking-[-0.02em]">
          Noted <span className="text-accent">List</span>
        </span>
      </div>

      {/* lists */}
      <div className="px-5 pb-1.5 pt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.09em] text-faint">
        Lists
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5">
        {lists.map((list) => {
          const active = list.id === activeListId
          const editing = editingId === list.id
          const confirming = confirmId === list.id
          return (
            <li key={list.id}>
              {editing ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => commitRename(list.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(list.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="w-full rounded-lg border border-accent bg-window px-2.5 py-2 text-[0.9rem] text-ink outline-none"
                />
              ) : confirming ? (
                <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.82rem]">
                  <span className="flex-1 truncate text-muted">Delete “{list.name}”?</span>
                  <button
                    onClick={() => { deleteList(list.id); setConfirmId(null) }}
                    className="rounded-md px-1.5 py-0.5 font-semibold text-[#e2483d] hover:bg-[color-mix(in_srgb,#e2483d_12%,transparent)]"
                  >
                    Delete
                  </button>
                  <button onClick={() => setConfirmId(null)} className="rounded-md px-1.5 py-0.5 text-muted hover:text-ink">
                    Cancel
                  </button>
                </div>
              ) : (
                <DroppableRow listId={list.id}>
                  <div
                    onClick={() => selectList(list.id)}
                    onDoubleClick={() => { setEditingId(list.id); setEditName(list.name) }}
                    className={`group relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.9rem] ${
                      active
                        ? 'bg-accent-soft font-semibold text-accent'
                        : 'text-ink hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]'
                    }`}
                  >
                    {active && (
                      <span className="absolute -left-px bottom-2 top-2 w-[3px] rounded bg-accent" />
                    )}
                    <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: dotVar(list.color) }} />
                    <span className="flex-1 truncate">{list.name}</span>
                    {lists.length > 1 && (
                      <button
                        title="Delete list"
                        onClick={(e) => { e.stopPropagation(); setConfirmId(list.id) }}
                        className="hidden flex-none text-faint hover:text-[#e2483d] group-hover:block"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                    <span className="min-w-[18px] text-right text-[0.75rem] tabular-nums text-muted group-hover:hidden">
                      {openCounts[list.id] || ''}
                    </span>
                  </div>
                </DroppableRow>
              )}
            </li>
          )
        })}
      </ul>

      {/* new list */}
      {adding ? (
        <input
          autoFocus
          placeholder="List name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={commitNew}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitNew()
            if (e.key === 'Escape') { setNewName(''); setAdding(false) }
          }}
          className="mx-2.5 mt-0.5 rounded-lg border border-accent bg-window px-2.5 py-2 text-[0.9rem] text-ink outline-none"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mx-2.5 mt-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.9rem] text-muted hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:text-ink"
        >
          <Icon name="plus" size={13} strokeWidth={2.4} />
          New list
        </button>
      )}

      {/* install (PWA) — only shown when the app can actually be installed */}
      {canInstall && (
        <div className="mx-2.5 mt-1.5">
          <button
            onClick={() => (canPrompt ? promptInstall() : setIosHint((v) => !v))}
            className="flex w-full items-center gap-2.5 rounded-lg border border-accent bg-accent-soft px-2.5 py-2 text-[0.85rem] font-medium text-accent hover:bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
          >
            <Icon name="download" size={15} strokeWidth={2.2} />
            Install app
          </button>
          {isIOS && iosHint && (
            <p className="mt-1.5 px-1 text-[0.75rem] leading-snug text-muted">
              Tap the Share button, then “Add to Home Screen”.
            </p>
          )}
        </div>
      )}

      {/* footer */}
      <div className="mt-auto flex items-center gap-2 border-t border-line px-4 py-3 text-[0.72rem] text-faint">
        <span className="flex flex-1 items-center gap-1.5">
          <Icon name="save" size={13} className="text-muted" />
          Saved on this device
        </span>
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle light or dark theme"
          className="grid h-7 w-7 place-items-center rounded-md border border-line bg-window text-muted hover:border-faint hover:text-ink"
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={15} />
        </button>
        <button
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open settings"
          className={`grid h-7 w-7 place-items-center rounded-md border ${
            settingsActive
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line bg-window text-muted hover:border-faint hover:text-ink'
          }`}
        >
          <Icon name="gear" size={15} />
        </button>
      </div>
    </aside>
  )
}
