import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Icon from './Icon.jsx'
import { useSelection } from '../store/StoreProvider.jsx'

// A single task row: drag grip · round checkbox · title. Clicking the title
// opens the detail panel (where notes + richer editing live). Kept deliberately
// single-line and fast — the richness is one click deep, not in the list.
export default function TaskItem({ task, onToggle, onDelete, sortable = false }) {
  const { selectedTaskId, selectTask } = useSelection()
  const selected = selectedTaskId === task.id

  const sort = useSortable({ id: task.id, disabled: !sortable })
  const dragStyle = sortable
    ? { transform: CSS.Transform.toString(sort.transform), transition: sort.transition }
    : undefined

  const hasNote = task.note.trim().length > 0
  const subs = task.subtasks || []
  const subsDone = subs.filter((s) => s.done).length

  return (
    <div
      ref={sortable ? sort.setNodeRef : undefined}
      style={dragStyle}
      className={`group relative grid grid-cols-[16px_22px_1fr_auto] items-center gap-2.5 rounded-[10px] px-2 py-2.5 ${
        selected ? 'bg-accent-soft' : 'hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]'
      } ${task.done ? 'opacity-70' : ''} ${sortable && sort.isDragging ? 'opacity-40' : ''}`}
    >
      {/* drag grip */}
      <span
        {...(sortable ? { ...sort.attributes, ...sort.listeners } : {})}
        className={`self-center text-faint opacity-0 transition-opacity group-hover:opacity-80 ${
          sortable ? 'cursor-grab touch-none active:cursor-grabbing' : ''
        }`}
        aria-label={sortable ? 'Drag to reorder or move to another list' : undefined}
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2" cy="3" r="1.4" /><circle cx="8" cy="3" r="1.4" />
          <circle cx="2" cy="8" r="1.4" /><circle cx="8" cy="8" r="1.4" />
          <circle cx="2" cy="13" r="1.4" /><circle cx="8" cy="13" r="1.4" />
        </svg>
      </span>

      {/* checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? 'Mark not done' : 'Complete task'}
        aria-pressed={task.done}
        className={`grid h-[22px] w-[22px] flex-none place-items-center self-center rounded-full border-2 transition-colors ${
          task.done
            ? 'border-accent bg-accent text-accent-ink'
            : 'border-faint text-transparent hover:border-accent'
        }`}
      >
        <Icon name="check" size={12} strokeWidth={3.5} />
      </button>

      {/* title → opens detail panel */}
      <button
        onClick={() => selectTask(task.id)}
        className="flex min-w-0 items-center gap-2 py-0.5 text-left"
      >
        <span
          className={`truncate text-[0.95rem] ${
            task.done ? 'text-done line-through decoration-[1.5px]' : 'text-ink'
          }`}
        >
          {task.title}
        </span>
        {subs.length > 0 && (
          <span
            className="flex flex-none items-center gap-1 text-[0.72rem] tabular-nums text-faint"
            title={`${subsDone} of ${subs.length} steps done`}
          >
            <Icon name="checklist" size={12} />
            {subsDone}/{subs.length}
          </span>
        )}
        {hasNote && (
          <Icon name="note" size={13} className="flex-none text-faint" title="Has a note" />
        )}
      </button>

      {/* delete */}
      <button
        title="Delete task"
        onClick={() => onDelete(task.id)}
        className="flex-none self-center text-faint opacity-0 transition-opacity hover:text-[#e2483d] group-hover:opacity-100"
      >
        <Icon name="trash" size={15} />
      </button>
    </div>
  )
}
