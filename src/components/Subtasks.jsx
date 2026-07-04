import { useState } from 'react'
import Icon from './Icon.jsx'

// A simple checklist inside a task (e.g. a shopping list). Add, tick off, remove.
export default function Subtasks({ task, onAdd, onToggle, onDelete }) {
  const [value, setValue] = useState('')
  const subs = task.subtasks || []
  const doneCount = subs.filter((s) => s.done).length

  const submit = () => {
    if (!value.trim()) return
    onAdd(task.id, value)
    setValue('')
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-faint">
          Checklist
        </span>
        {subs.length > 0 && (
          <span className="text-[0.72rem] tabular-nums text-muted">
            {doneCount}/{subs.length}
          </span>
        )}
      </div>

      {subs.length > 0 && (
        <ul className="mb-1.5 flex flex-col gap-0.5">
          {subs.map((s) => (
            <li key={s.id} className="group flex items-center gap-2.5 rounded-md px-1 py-1">
              <button
                onClick={() => onToggle(task.id, s.id)}
                aria-label={s.done ? 'Mark step not done' : 'Complete step'}
                aria-pressed={s.done}
                className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-full border-2 transition-colors ${
                  s.done
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-faint text-transparent hover:border-accent'
                }`}
              >
                <Icon name="check" size={10} strokeWidth={4} />
              </button>
              <span
                className={`flex-1 text-[0.88rem] ${
                  s.done ? 'text-done line-through decoration-[1.5px]' : 'text-ink'
                }`}
              >
                {s.title}
              </span>
              <button
                onClick={() => onDelete(task.id, s.id)}
                title="Remove step"
                aria-label="Remove step"
                className="flex-none text-faint opacity-0 transition-opacity hover:text-[#e2483d] group-hover:opacity-100"
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2.5 px-1">
        <span className="h-[18px] w-[18px] flex-none rounded-full border-2 border-dashed border-faint" aria-hidden="true" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Add a step…"
          aria-label="Add a checklist step"
          className="flex-1 bg-transparent py-0.5 text-[0.88rem] text-ink outline-none placeholder:text-faint"
        />
      </div>
    </div>
  )
}
