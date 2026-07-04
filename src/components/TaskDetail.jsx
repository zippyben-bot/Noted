import { useState } from 'react'
import Icon from './Icon.jsx'
import NoteEditor from './NoteEditor.jsx'
import Subtasks from './Subtasks.jsx'
import { useTaskActions } from '../store/StoreProvider.jsx'

// Detail panel for a single task. Right-hand column on desktop, full-screen
// sheet on mobile. Holds the richer editing: title, completion, markdown note,
// move-to-list, delete.
export default function TaskDetail({ task, onClose }) {
  const { toggleTask, setNote, setTitle, deleteTask, moveTask, lists,
    addSubtask, toggleSubtask, deleteSubtask } = useTaskActions()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const created = new Date(task.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-window md:static md:z-auto md:w-[380px] md:flex-none md:border-l md:border-line">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-line-soft px-3 py-2.5">
        <button
          onClick={onClose}
          title="Close"
          aria-label="Close detail panel"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:text-ink"
        >
          <Icon name="x" size={18} />
        </button>
        <span className="flex-1 text-[0.72rem] uppercase tracking-[0.09em] text-faint">
          Task
        </span>
        {confirmDelete ? (
          <div className="flex items-center gap-1 text-[0.8rem]">
            <span className="text-muted">Delete?</span>
            <button
              onClick={() => deleteTask(task.id)}
              className="rounded-md px-2 py-1 font-semibold text-[#e2483d] hover:bg-[color-mix(in_srgb,#e2483d_12%,transparent)]"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-2 py-1 text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete task"
            aria-label="Delete task"
            className="grid h-8 w-8 place-items-center rounded-md text-faint hover:bg-[color-mix(in_srgb,#e2483d_10%,transparent)] hover:text-[#e2483d]"
          >
            <Icon name="trash" size={17} />
          </button>
        )}
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* title + complete */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleTask(task.id)}
            aria-label={task.done ? 'Mark not done' : 'Complete task'}
            aria-pressed={task.done}
            className={`mt-0.5 grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-2 transition-colors ${
              task.done
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-faint text-transparent hover:border-accent'
            }`}
          >
            <Icon name="check" size={12} strokeWidth={3.5} />
          </button>
          <input
            key={task.id}
            defaultValue={task.title}
            onBlur={(e) => setTitle(task.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            aria-label="Task title"
            className={`min-w-0 flex-1 bg-transparent text-[1.15rem] font-[620] leading-snug tracking-[-0.01em] outline-none ${
              task.done ? 'text-done line-through' : 'text-ink'
            }`}
          />
        </div>

        {/* checklist */}
        <div className="mt-6">
          <Subtasks
            task={task}
            onAdd={addSubtask}
            onToggle={toggleSubtask}
            onDelete={deleteSubtask}
          />
        </div>

        {/* note */}
        <div className="mt-6">
          <div className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">
            Note
          </div>
          <NoteEditor note={task.note} onChange={(v) => setNote(task.id, v)} />
        </div>
      </div>

      {/* footer: move + meta */}
      <div className="border-t border-line-soft px-5 py-3">
        {lists.length > 1 && (
          <label className="mb-2 flex items-center gap-2 text-[0.8rem] text-muted">
            <span className="text-faint">List</span>
            <select
              value={task.listId}
              onChange={(e) => moveTask(task.id, e.target.value)}
              className="flex-1 rounded-md border border-line bg-window px-2 py-1 text-[0.82rem] text-ink outline-none focus:border-accent"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="text-[0.72rem] text-faint">Created {created}</div>
      </div>
    </aside>
  )
}
