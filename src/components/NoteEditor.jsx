import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { EditorState, RangeSetBuilder, Annotation } from '@codemirror/state'
import { EditorView, keymap, placeholder, Decoration, ViewPlugin } from '@codemirror/view'
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { syntaxTree, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// Markdown note with a live-preview editor: bold reads bold, links read as
// links (⌘/Ctrl-click to open), headings scale — the raw **/[]() markers only
// reappear on the construct your cursor is inside, so it stays editable.
// Markdown is still the stored source of truth (portable, sync-friendly);
// CodeMirror just renders it in place.

// Styles applied to rendered constructs, keyed off the markdown parser's tags.
const highlight = HighlightStyle.define([
  { tag: t.strong, fontWeight: '680', color: 'var(--ink)' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: 'var(--muted)' },
  { tag: t.heading1, fontSize: '1.15rem', fontWeight: '680', color: 'var(--ink)' },
  { tag: t.heading2, fontSize: '1.05rem', fontWeight: '680', color: 'var(--ink)' },
  { tag: t.heading3, fontSize: '0.98rem', fontWeight: '680', color: 'var(--ink)' },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: '680', color: 'var(--ink)' },
  { tag: t.link, color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '2px' },
  { tag: t.url, color: 'var(--muted)' },
  { tag: t.monospace, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem' },
  { tag: t.quote, color: 'var(--muted)', fontStyle: 'italic' },
  { tag: t.list, color: 'var(--muted)' }
])

// Syntax marks we collapse when the cursor isn't inside their construct.
const MARKS = new Set([
  'EmphasisMark', 'CodeMark', 'StrikethroughMark', 'LinkMark', 'URL', 'HeaderMark', 'QuoteMark'
])
const hidden = Decoration.replace({})

// Hide markdown punctuation unless a selection sits inside the enclosing
// construct (Emphasis/Link/heading line…), which reveals it for editing.
const livePreview = ViewPlugin.fromClass(
  class {
    constructor(view) { this.decorations = this.build(view) }
    update(u) {
      if (u.docChanged || u.selectionSet || u.viewportChanged) this.decorations = this.build(u.view)
    }
    build(view) {
      const b = new RangeSetBuilder()
      const sel = view.state.selection
      const revealed = (from, to) => sel.ranges.some((r) => r.from <= to && r.to >= from)
      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from, to,
          enter: (node) => {
            if (!MARKS.has(node.name)) return
            const parent = node.node.parent
            const cf = parent ? parent.from : node.from
            const ct = parent ? parent.to : node.to
            if (revealed(cf, ct)) return
            // swallow the space after a heading's "#" so it doesn't leave a gap
            let end = node.to
            if (node.name === 'HeaderMark' && view.state.doc.sliceString(node.to, node.to + 1) === ' ') end = node.to + 1
            if (node.from < end) b.add(node.from, end, hidden)
          }
        })
      }
      return b.finish()
    }
  },
  { decorations: (v) => v.decorations }
)

const theme = EditorView.theme({
  '&': { color: 'var(--ink)', backgroundColor: 'transparent', fontSize: '0.9rem' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'inherit', lineHeight: '1.6' }, // override CM's default monospace
  '.cm-content': { padding: '2px 0', caretColor: 'var(--accent)' },
  '.cm-line': { padding: '0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '.cm-placeholder': { color: 'var(--faint)' }
})

// ⌘/Ctrl-click a link's text to open it (http(s)/mailto only, new tab).
const openLinks = EditorView.domEventHandlers({
  mousedown: (e, view) => {
    if (!(e.metaKey || e.ctrlKey)) return false
    const pos = view.posAtCoords({ x: e.clientX, y: e.clientY })
    if (pos == null) return false
    let node = syntaxTree(view.state).resolveInner(pos, 1)
    while (node && node.name !== 'Link') node = node.parent
    const urlNode = node && node.getChild('URL')
    if (!urlNode) return false
    const url = view.state.doc.sliceString(urlNode.from, urlNode.to)
    if (/^(https?:|mailto:)/i.test(url)) {
      window.open(url, '_blank', 'noopener')
      e.preventDefault()
      return true
    }
    return false
  }
})

const External = Annotation.define() // marks doc updates that came from props, not the user

export default function NoteEditor({ note, onChange }) {
  const box = useRef(null)
  const view = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [focused, setFocused] = useState(false)

  // create the editor once
  useEffect(() => {
    const v = new EditorView({
      parent: box.current,
      state: EditorState.create({
        doc: note,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(highlight),
          livePreview,
          EditorView.lineWrapping,
          placeholder('Write a note…  **bold**, *italic*, - lists, [links](url)'),
          theme,
          openLinks,
          EditorView.updateListener.of((u) => {
            if (u.focusChanged) setFocused(u.view.hasFocus)
            if (u.docChanged && !u.transactions.some((tr) => tr.annotation(External))) {
              onChangeRef.current(u.state.doc.toString())
            }
          })
        ]
      })
    })
    view.current = v
    return () => v.destroy()
  }, [])

  // sync external note changes (e.g. switching tasks) into the editor
  useEffect(() => {
    const v = view.current
    if (!v) return
    const current = v.state.doc.toString()
    if (note !== current) {
      v.dispatch({ changes: { from: 0, to: current.length, insert: note }, annotation: External.of(true) })
    }
  }, [note])

  const wrap = (before, after) => {
    const v = view.current
    const { from, to } = v.state.selection.main
    v.dispatch({
      changes: [{ from, insert: before }, { from: to, insert: after }],
      selection: { anchor: from + before.length, head: to + before.length }
    })
    v.focus()
  }

  const bulletList = () => {
    const v = view.current
    const { from, to } = v.state.selection.main
    const doc = v.state.doc
    const changes = []
    for (let n = doc.lineAt(from).number; n <= doc.lineAt(to).number; n++) {
      changes.push({ from: doc.line(n).from, insert: '- ' })
    }
    v.dispatch({ changes })
    v.focus()
  }

  const insertLink = () => {
    const v = view.current
    const { from, to } = v.state.selection.main
    const label = v.state.doc.sliceString(from, to) || 'text'
    const insert = `[${label}](url)`
    const urlStart = from + label.length + 3 // after "[label]("
    v.dispatch({ changes: { from, to, insert }, selection: { anchor: urlStart, head: urlStart + 3 } })
    v.focus()
  }

  const ToolBtn = ({ onClick, label, children }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()} // keep editor focus/selection
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:text-ink"
    >
      {children}
    </button>
  )

  return (
    <div className="rounded-lg p-1 -m-1 hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
      <div
        className={`mb-1.5 flex items-center gap-0.5 overflow-hidden border-b border-line-soft transition-all ${
          focused ? 'max-h-9 pb-1.5 opacity-100' : 'max-h-0 border-transparent opacity-0'
        }`}
      >
        <ToolBtn onClick={() => wrap('**', '**')} label="Bold">
          <span className="text-[0.9rem] font-bold">B</span>
        </ToolBtn>
        <ToolBtn onClick={() => wrap('*', '*')} label="Italic">
          <span className="text-[0.9rem] italic font-serif">I</span>
        </ToolBtn>
        <ToolBtn onClick={bulletList} label="Bullet list">
          <Icon name="list" size={16} />
        </ToolBtn>
        <ToolBtn onClick={insertLink} label="Link">
          <Icon name="link" size={15} />
        </ToolBtn>
      </div>
      <div ref={box} className="cursor-text" />
    </div>
  )
}
