import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import Sidebar from './components/Sidebar.jsx'
import TaskList from './components/TaskList.jsx'
import TaskDetail from './components/TaskDetail.jsx'
import { useLists, useReady, useDragActions, useSelection } from './store/StoreProvider.jsx'

// Prioritise the droppable directly under the pointer (so a narrow sidebar list
// wins even though the dragged task row is full-width); fall back to closest
// centre so in-list reordering stays smooth in the gaps between rows.
function collisionDetection(args) {
  const hits = pointerWithin(args)
  return hits.length ? hits : closestCenter(args)
}

export default function App() {
  const ready = useReady()
  const { activeList } = useLists()
  const { tasks, activeListId, reorderTasks, moveTask } = useDragActions()
  const { selectedTaskId, closeTask } = useSelection()
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null
  const [dragging, setDragging] = useState(null) // the task being dragged (for the overlay)

  // Small activation distance so clicks/taps still work; touch needs a short
  // hold so scrolling isn't hijacked. This is what makes reorder work on mobile.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragStart = ({ active }) => {
    setDragging(tasks.find((t) => t.id === active.id) ?? null)
  }

  const onDragEnd = ({ active, over }) => {
    setDragging(null)
    if (!over) return

    // dropped on a sidebar list → move to that list (if it's a different one)
    if (typeof over.id === 'string' && over.id.startsWith('list:')) {
      const targetListId = over.id.slice('list:'.length)
      const moved = tasks.find((t) => t.id === active.id)
      if (moved && moved.listId !== targetListId) moveTask(active.id, targetListId)
      return
    }

    // dropped on another task → reorder within the active list
    if (active.id !== over.id) {
      const openIds = tasks
        .filter((t) => t.listId === activeListId && !t.done)
        .sort((a, b) => a.order - b.order)
        .map((t) => t.id)
      const from = openIds.indexOf(active.id)
      const to = openIds.indexOf(over.id)
      if (from !== -1 && to !== -1) reorderTasks(activeListId, arrayMove(openIds, from, to))
    }
  }

  // Fills the whole window — no drawn title bar. Installed as a standalone PWA,
  // the OS supplies the real window chrome.
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="flex h-full bg-window text-ink">
        <Sidebar />
        <main className="flex min-w-0 flex-1">
          {ready && activeList ? (
            <TaskList list={activeList} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-[0.85rem] text-muted">
              {ready ? 'Select a list' : 'Loading…'}
            </div>
          )}
        </main>
        {selectedTask && <TaskDetail task={selectedTask} onClose={closeTask} />}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-window px-2 py-2.5 shadow-window">
            <span className="h-[22px] w-[22px] flex-none rounded-full border-2 border-faint" />
            <span className="pr-3 text-[0.95rem] text-ink">{dragging.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
