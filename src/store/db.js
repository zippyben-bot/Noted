import { openDB } from 'idb'

// ---------------------------------------------------------------------------
// Storage adapter (IndexedDB via idb).
//
// This is the ONLY module that talks to the persistence engine. Everything
// else — hooks, components — goes through the `storage` interface below.
// To move to a cloud API later, reimplement these same methods against fetch
// and nothing upstream has to change. Keep this boundary strict.
// ---------------------------------------------------------------------------

const DB_NAME = 'noted-list'
const DB_VERSION = 1

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('lists')) {
      db.createObjectStore('lists', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('tasks')) {
      const tasks = db.createObjectStore('tasks', { keyPath: 'id' })
      tasks.createIndex('listId', 'listId')
    }
  }
})

const id = () => crypto.randomUUID()
const now = () => Date.now()

const LIST_COLORS = ['indigo', 'orange', 'green', 'pink', 'blue', 'amber']

export const storage = {
  // ---- lists ----
  async getLists() {
    const db = await dbPromise
    const lists = await db.getAll('lists')
    return lists.sort((a, b) => a.order - b.order)
  },

  async createList({ name, color }) {
    const db = await dbPromise
    const existing = await db.getAll('lists')
    const order = existing.length ? Math.max(...existing.map((l) => l.order)) + 1 : 0
    const list = {
      id: id(),
      name: name.trim() || 'Untitled list',
      color: color || LIST_COLORS[existing.length % LIST_COLORS.length],
      order,
      createdAt: now()
    }
    await db.put('lists', list)
    return list
  },

  async updateList(listId, patch) {
    const db = await dbPromise
    const list = await db.get('lists', listId)
    if (!list) return null
    const updated = { ...list, ...patch }
    await db.put('lists', updated)
    return updated
  },

  async deleteList(listId) {
    const db = await dbPromise
    const tx = db.transaction(['lists', 'tasks'], 'readwrite')
    await tx.objectStore('lists').delete(listId)
    // cascade delete the list's tasks
    const index = tx.objectStore('tasks').index('listId')
    let cursor = await index.openCursor(listId)
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  },

  // ---- tasks ----
  async getTasks(listId) {
    const db = await dbPromise
    const tasks = await db.getAllFromIndex('tasks', 'listId', listId)
    return tasks.sort((a, b) => a.order - b.order)
  },

  async getAllTasks() {
    const db = await dbPromise
    return db.getAll('tasks')
  },

  async createTask({ listId, title, order }) {
    // `order` is supplied by the store from a race-free in-memory counter —
    // deriving it from an IDB read here would race under rapid successive adds.
    const db = await dbPromise
    const task = {
      id: id(),
      listId,
      title: title.trim(),
      note: '',
      done: false,
      subtasks: [], // [{ id, title, done }]
      order,
      createdAt: now(),
      completedAt: null
    }
    await db.put('tasks', task)
    return task
  },

  async updateTask(taskId, patch) {
    const db = await dbPromise
    const task = await db.get('tasks', taskId)
    if (!task) return null
    const updated = { ...task, ...patch }
    await db.put('tasks', updated)
    return updated
  },

  // Flip done based on the stored value — the adapter is the source of truth,
  // so this can't be corrupted by an as-yet-unrun React state update.
  async toggleTask(taskId) {
    const db = await dbPromise
    const task = await db.get('tasks', taskId)
    if (!task) return null
    const done = !task.done
    const updated = { ...task, done, completedAt: done ? now() : null }
    await db.put('tasks', updated)
    return updated
  },

  async deleteTask(taskId) {
    const db = await dbPromise
    await db.delete('tasks', taskId)
  },

  // ---- backup / restore ----
  async exportAll() {
    const db = await dbPromise
    const [lists, tasks] = await Promise.all([db.getAll('lists'), db.getAll('tasks')])
    return { lists, tasks }
  },

  // Replace all data with an imported set (used for restore-from-backup).
  async importAll({ lists, tasks }) {
    const db = await dbPromise
    const tx = db.transaction(['lists', 'tasks'], 'readwrite')
    await tx.objectStore('lists').clear()
    await tx.objectStore('tasks').clear()
    for (const l of lists) await tx.objectStore('lists').put(l)
    for (const t of tasks) await tx.objectStore('tasks').put(t)
    await tx.done
  },

  // persist a reordered set of tasks (called after drag-and-drop)
  async reorderTasks(orderedTasks) {
    const db = await dbPromise
    const tx = db.transaction('tasks', 'readwrite')
    await Promise.all(
      orderedTasks.map((t, i) => tx.store.put({ ...t, order: i }))
    )
    await tx.done
  }
}

export { LIST_COLORS }
