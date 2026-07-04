import { storage } from '../store/db.js'

// JSON backup/restore of all lists + tasks. Your data lives only in this
// browser's IndexedDB, so this is the escape hatch: download a copy, or restore
// one, independent of the browser and (eventually) of cloud sync.

const FORMAT = 'blunderlist-backup'

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
  a.download = `blunderlist-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { lists: lists.length, tasks: tasks.length }
}

export async function importData(file) {
  const data = JSON.parse(await file.text())
  if (data.format !== FORMAT || !Array.isArray(data.lists) || !Array.isArray(data.tasks)) {
    throw new Error('That doesn’t look like a blunderlist backup file.')
  }
  await storage.importAll({ lists: data.lists, tasks: data.tasks })
  return { lists: data.lists.length, tasks: data.tasks.length }
}
