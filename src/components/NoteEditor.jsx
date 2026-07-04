import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { renderMarkdown } from '../lib/markdown.js'

// Markdown note: renders formatted when idle, becomes a textarea (with a small
// formatting toolbar) when you click into it. Stores raw markdown via onChange.
export default function NoteEditor({ note, onChange }) {
  const [editing, setEditing] = useState(false)
  const ref = useRef(null)
  const pendingSel = useRef(null)

  const hasNote = note.trim().length > 0

  // grow to fit + restore any pending selection after a toolbar edit
  useEffect(() => {
    if (!editing || !ref.current) return
    const el = ref.current
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
    if (pendingSel.current) {
      el.focus()
      el.setSelectionRange(pendingSel.current[0], pendingSel.current[1])
      pendingSel.current = null
    }
  }, [editing, note])

  const surround = (before, after) => {
    const el = ref.current
    const { selectionStart: s, selectionEnd: e } = el
    const sel = note.slice(s, e)
    onChange(note.slice(0, s) + before + sel + after + note.slice(e))
    pendingSel.current = [s + before.length, e + before.length]
  }

  const bulletList = () => {
    const el = ref.current
    const { selectionStart: s, selectionEnd: e } = el
    const lineStart = note.lastIndexOf('\n', s - 1) + 1
    const block = note.slice(lineStart, e) || ''
    const prefixed = block
      .split('\n')
      .map((l) => (l.length ? '- ' + l : '- '))
      .join('\n')
    onChange(note.slice(0, lineStart) + prefixed + note.slice(e))
    pendingSel.current = [lineStart, lineStart + prefixed.length]
  }

  const insertLink = () => {
    const el = ref.current
    const { selectionStart: s, selectionEnd: e } = el
    const label = note.slice(s, e) || 'text'
    const insert = `[${label}](url)`
    onChange(note.slice(0, s) + insert + note.slice(e))
    const urlStart = s + label.length + 3 // after "[label]("
    pendingSel.current = [urlStart, urlStart + 3]
  }

  const ToolBtn = ({ onClick, label, children }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()} // keep textarea focus/selection
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:text-ink"
    >
      {children}
    </button>
  )

  if (!editing) {
    return hasNote ? (
      <div
        onClick={() => setEditing(true)}
        className="note-content cursor-text rounded-lg p-1 -m-1 hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(note) }}
      />
    ) : (
      <button
        onClick={() => setEditing(true)}
        className="w-full rounded-lg py-2 text-left text-[0.9rem] text-faint hover:text-muted"
      >
        Add a note… <span className="text-[0.78rem]">(markdown supported)</span>
      </button>
    )
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-0.5 border-b border-line-soft pb-1.5">
        <ToolBtn onClick={() => surround('**', '**')} label="Bold">
          <span className="text-[0.9rem] font-bold">B</span>
        </ToolBtn>
        <ToolBtn onClick={() => surround('*', '*')} label="Italic">
          <span className="text-[0.9rem] italic font-serif">I</span>
        </ToolBtn>
        <ToolBtn onClick={bulletList} label="Bullet list">
          <Icon name="list" size={16} />
        </ToolBtn>
        <ToolBtn onClick={insertLink} label="Link">
          <Icon name="link" size={15} />
        </ToolBtn>
      </div>
      <textarea
        ref={ref}
        autoFocus
        value={note}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        placeholder="Write a note… **bold**, *italic*, - lists, [links](url)"
        rows={3}
        className="w-full resize-none rounded-lg bg-transparent font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[0.86rem] leading-[1.55] text-ink outline-none placeholder:text-faint"
      />
      <div className="mt-1 text-right">
        <button
          onClick={() => setEditing(false)}
          className="text-[0.75rem] font-medium text-accent hover:underline"
        >
          Done
        </button>
      </div>
    </div>
  )
}
