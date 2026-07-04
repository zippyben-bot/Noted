import { marked } from 'marked'

// Notes are stored as plain markdown (portable, sync-friendly) and rendered
// to HTML for display. This wrapper keeps rendering safe:
//   1. angle brackets in the source are escaped first, so a note can never
//      inject raw HTML / <script> — only markdown syntax is honoured;
//   2. links are restricted to http(s)/mailto and opened in a new tab.
// (Single-user local app today; when multi-user sync lands, revisit with a
// dedicated sanitizer like DOMPurify.)

marked.use({ gfm: true, breaks: true })

const escapeAngles = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function renderMarkdown(src) {
  if (!src || !src.trim()) return ''
  const html = marked.parse(escapeAngles(src))
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  tpl.content.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || ''
    if (!/^(https?:|mailto:)/i.test(href)) {
      a.removeAttribute('href')
    } else {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    }
  })
  return tpl.innerHTML
}
