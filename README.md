# blunderlist

A lightweight, local-first checklist app inspired by Wunderlist. Add tasks fast,
check them off, organise them into lists, and keep the detail (notes, subtasks)
one click deep. Runs entirely in the browser — data lives in IndexedDB on your
device — and installs as a standalone PWA.

## Features

- **Quick-add** — type, hit Enter, done. Focus stays put for rapid entry.
- **Lists** — named lists with colour dots and live open-counts.
- **Detail panel** — per task: markdown note, a checklist of subtasks, move-to-list.
- **Drag & drop** — reorder within a list or drag onto another list (touch + keyboard supported).
- **Palettes** — six full light/dark themes; System / Light / Dark.
- **Local-first** — everything saved on-device; one-click JSON export / import for backup.

## Stack

React + Vite + Tailwind · IndexedDB (via `idb`) behind a storage adapter · `dnd-kit` · `marked` · vite-plugin-pwa (`display: standalone`).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

The persistence layer is abstracted behind `src/store/db.js`, so swapping
IndexedDB for a cloud API later is a one-file change.
