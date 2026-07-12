import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { storage } from './db.js'

// ---------------------------------------------------------------------------
// In-memory store, hydrated from the storage adapter once on load.
//
// The whole dataset (a personal checklist) lives in memory so every
// interaction is instant — no loading states, no per-action awaits blocking
// the UI. Mutations update state optimistically and persist to IndexedDB in
// the background through `storage`. Swapping IndexedDB for a cloud API only
// touches db.js; this provider is unchanged.
// ---------------------------------------------------------------------------

const StoreContext = createContext(null)

const ACTIVE_KEY = 'noted:activeListId'

// Module-scoped guard so React StrictMode's double-invoked mount effect can't
// hydrate (and seed a default list) twice in development.
let didHydrate = false

export function StoreProvider({ children }) {
  const [lists, setLists] = useState([])
  const [tasks, setTasks] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [ready, setReady] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(null) // task open in the detail panel

  // Monotonic order counter for new tasks — incremented synchronously so
  // bursts of rapid adds never collide (unlike re-reading IDB each time).
  const orderSeq = useRef(0)

  // Always-current mirror of tasks, so mutations that read-modify-write a task
  // (e.g. subtasks) use fresh data without a stale closure or a double-invoked
  // updater re-running an append.
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // ---- hydrate once ----
  useEffect(() => {
    if (didHydrate) return
    didHydrate = true
    ;(async () => {
      let loadedLists = await storage.getLists()
      if (loadedLists.length === 0) {
        // clean first-run: one starter list so the app opens onto something
        const first = await storage.createList({ name: 'Personal', color: 'indigo' })
        loadedLists = [first]
      }
      const loadedTasks = await storage.getAllTasks()
      orderSeq.current = loadedTasks.length
        ? Math.max(...loadedTasks.map((t) => t.order)) + 1
        : 0
      setLists(loadedLists)
      setTasks(loadedTasks)
      const saved = localStorage.getItem(ACTIVE_KEY)
      const initial = loadedLists.find((l) => l.id === saved)?.id ?? loadedLists[0].id
      setActiveListId(initial)
      setReady(true)
    })()
  }, [])

  const selectList = useCallback((listId) => {
    setActiveListId(listId)
    setSelectedTaskId(null) // close the detail panel when switching lists
    localStorage.setItem(ACTIVE_KEY, listId)
  }, [])

  const selectTask = useCallback((taskId) => setSelectedTaskId(taskId), [])
  const closeTask = useCallback(() => setSelectedTaskId(null), [])

  // ---- list mutations ----
  const addList = useCallback(async (name) => {
    const list = await storage.createList({ name })
    setLists((prev) => [...prev, list])
    selectList(list.id)
    return list
  }, [selectList])

  const renameList = useCallback(async (listId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name: trimmed } : l)))
    await storage.updateList(listId, { name: trimmed })
  }, [])

  const deleteList = useCallback(async (listId) => {
    const remaining = lists.filter((l) => l.id !== listId)
    setLists(remaining)
    setTasks((prev) => prev.filter((t) => t.listId !== listId))
    if (activeListId === listId && remaining.length) selectList(remaining[0].id)
    await storage.deleteList(listId)
  }, [lists, activeListId, selectList])

  // ---- task mutations ----
  const addTask = useCallback(async (listId, title) => {
    const clean = title.trim()
    if (!clean) return
    // new tasks append to the bottom of the list
    const order = orderSeq.current++
    const task = await storage.createTask({ listId, title: clean, order })
    setTasks((prev) => [...prev, task])
    return task
  }, [])

  const toggleTask = useCallback(async (taskId) => {
    // optimistic flip in memory (uses `prev`, so it's always correct)…
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null }
          : t
      )
    )
    // …and persist by flipping the stored value independently
    await storage.toggleTask(taskId)
  }, [])

  const setNote = useCallback(async (taskId, note) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, note } : t)))
    await storage.updateTask(taskId, { note })
  }, [])

  const setTitle = useCallback(async (taskId, title) => {
    const clean = title.trim()
    if (!clean) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title: clean } : t)))
    await storage.updateTask(taskId, { title: clean })
  }, [])

  const deleteTask = useCallback(async (taskId) => {
    setSelectedTaskId((cur) => (cur === taskId ? null : cur)) // close panel if open
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await storage.deleteTask(taskId)
  }, [])

  // ---- subtasks (a checklist inside a task) ----
  const writeSubtasks = async (taskId, subtasks) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks } : t)))
    await storage.updateTask(taskId, { subtasks })
  }

  const addSubtask = useCallback(async (taskId, title) => {
    const clean = title.trim()
    if (!clean) return
    const task = tasksRef.current.find((t) => t.id === taskId)
    if (!task) return
    const subtasks = [...(task.subtasks || []), { id: crypto.randomUUID(), title: clean, done: false }]
    await writeSubtasks(taskId, subtasks)
  }, [])

  const toggleSubtask = useCallback(async (taskId, subId) => {
    const task = tasksRef.current.find((t) => t.id === taskId)
    if (!task) return
    const subtasks = (task.subtasks || []).map((s) =>
      s.id === subId ? { ...s, done: !s.done } : s
    )
    await writeSubtasks(taskId, subtasks)
  }, [])

  const deleteSubtask = useCallback(async (taskId, subId) => {
    const task = tasksRef.current.find((t) => t.id === taskId)
    if (!task) return
    await writeSubtasks(taskId, (task.subtasks || []).filter((s) => s.id !== subId))
  }, [])

  // move a task to a different list, dropping it at the bottom
  const moveTask = useCallback(async (taskId, targetListId) => {
    const order = orderSeq.current++
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, listId: targetListId, order } : t))
    )
    await storage.updateTask(taskId, { listId: targetListId, order })
  }, [])

  // reorder open tasks within a list; `orderedIds` is the new top-to-bottom order
  const reorderTasks = useCallback(async (listId, orderedIds) => {
    const byId = new Map(tasks.map((t) => [t.id, t]))
    // resolve ids to tasks, dropping any stale/unknown id so we never build a
    // record without its `id` keyPath (which would throw on the IndexedDB put)
    const reordered = orderedIds
      .map((tid) => byId.get(tid))
      .filter(Boolean)
      .map((t, i) => ({ ...t, order: i }))
    const movedIds = new Set(reordered.map((t) => t.id))
    setTasks((prev) => {
      const untouched = prev.filter((t) => !movedIds.has(t.id))
      return [...untouched, ...reordered]
    })
    await storage.reorderTasks(reordered)
  }, [tasks])

  const value = useMemo(
    () => ({
      ready,
      lists,
      tasks,
      activeListId,
      selectedTaskId,
      selectList,
      selectTask,
      closeTask,
      addList,
      renameList,
      deleteList,
      addTask,
      toggleTask,
      setNote,
      setTitle,
      deleteTask,
      moveTask,
      reorderTasks,
      addSubtask,
      toggleSubtask,
      deleteSubtask
    }),
    [ready, lists, tasks, activeListId, selectedTaskId, selectList, selectTask, closeTask,
      addList, renameList, deleteList, addTask, toggleTask, setNote, setTitle, deleteTask,
      moveTask, reorderTasks, addSubtask, toggleSubtask, deleteSubtask]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// ---- public hooks (the interface components use) ----

export function useLists() {
  const { lists, tasks, activeListId, selectList, addList, renameList, deleteList } = useStore()
  const activeList = lists.find((l) => l.id === activeListId) ?? null
  // open-task count per list, for the sidebar badges
  const openCounts = useMemo(() => {
    const counts = {}
    for (const l of lists) counts[l.id] = 0
    for (const t of tasks) if (!t.done && counts[t.listId] !== undefined) counts[t.listId]++
    return counts
  }, [lists, tasks])
  return { lists, activeList, activeListId, openCounts, selectList, addList, renameList, deleteList }
}

export function useTasks(listId) {
  const { tasks, addTask, toggleTask, setNote, setTitle, deleteTask, reorderTasks } = useStore()
  const listTasks = useMemo(
    () => tasks.filter((t) => t.listId === listId).sort((a, b) => a.order - b.order),
    [tasks, listId]
  )
  const open = listTasks.filter((t) => !t.done)
  const done = listTasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  return {
    open,
    done,
    addTask: (title) => addTask(listId, title),
    toggleTask,
    setNote,
    setTitle,
    deleteTask,
    reorder: (orderedIds) => reorderTasks(listId, orderedIds)
  }
}

export function useReady() {
  return useStore().ready
}

// Actions + data needed by the app-level DndContext (spans sidebar + task list).
export function useDragActions() {
  const { tasks, activeListId, reorderTasks, moveTask } = useStore()
  return { tasks, activeListId, reorderTasks, moveTask }
}

// Detail-panel selection: which task is open, and how to open/close it.
export function useSelection() {
  const { selectedTaskId, selectTask, closeTask } = useStore()
  return { selectedTaskId, selectTask, closeTask }
}

// Per-task mutations for the detail panel (which lives above the list).
export function useTaskActions() {
  const { toggleTask, setNote, setTitle, deleteTask, moveTask, lists,
    addSubtask, toggleSubtask, deleteSubtask } = useStore()
  return { toggleTask, setNote, setTitle, deleteTask, moveTask, lists,
    addSubtask, toggleSubtask, deleteSubtask }
}
