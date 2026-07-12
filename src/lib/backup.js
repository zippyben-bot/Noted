import { storage } from '../store/db.js'

// JSON backup/restore of all lists + tasks. Your data lives only in this
// browser's IndexedDB, so this is the escape hatch: download a copy, or restore
// one, independent of the browser and (eventually) of cloud sync.

const FORMAT = 'noted-backup'

export async function exportData() {
  const { lists, tasks } = await storage.exportAll()
  const payload = {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    lists,
    tasks
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `noted-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { lists: lists.length, tasks: tasks.length }
}

export async function importData(file) {
  let data
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('That file isn’t valid JSON.')
  }
  if (data?.format !== FORMAT || !Array.isArray(data.lists) || !Array.isArray(data.tasks)) {
    throw new Error('That doesn’t look like a Noted backup file.')
  }
  // Keep only well-formed records so a malformed file can't corrupt the store
  // (a record missing its `id` keyPath would otherwise abort the whole import).
  const lists = data.lists.filter((l) => l && typeof l.id === 'string' && typeof l.name === 'string')
  const tasks = data.tasks.filter((t) => t && typeof t.id === 'string' && typeof t.listId === 'string')
  if (!lists.length) throw new Error('That backup has no valid lists.')
  await storage.importAll({ lists, tasks })
  return { lists: lists.length, tasks: tasks.length }
}
