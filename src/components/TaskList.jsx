import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Icon from './Icon.jsx'
import TaskItem from './TaskItem.jsx'
import AddTaskInput from './AddTaskInput.jsx'
import { useTasks } from '../store/StoreProvider.jsx'

export default function TaskList({ list }) {
  const { open, done, addTask, toggleTask, deleteTask } = useTasks(list.id)
  const [showDone, setShowDone] = useState(true)

  const total = open.length + done.length

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      {/* header */}
      <div className="border-b border-line-soft px-7 pb-3.5 pt-[22px]">
        <h1 className="m-0 text-2xl font-[650] tracking-[-0.02em] text-balance">{list.name}</h1>
        <div className="mt-1 text-[0.8rem] tabular-nums text-muted">
          {total === 0
            ? 'No tasks yet'
            : `${open.length} open${done.length ? ` · ${done.length} done` : ''}`}
        </div>
      </div>

      {/* scroll area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-7 pt-4">
        <AddTaskInput onAdd={addTask} />

        {total === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-faint text-faint">
              <Icon name="check" size={22} strokeWidth={2.5} />
            </div>
            <p className="text-[0.95rem] font-medium text-ink">Nothing here yet</p>
            <p className="mt-1 text-[0.82rem] text-muted">
              Add your first task above and hit Enter.
            </p>
          </div>
        )}

        {/* open tasks — sortable, and draggable onto other lists */}
        <SortableContext items={open.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {open.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              sortable
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
        </SortableContext>

        {/* completed */}
        {done.length > 0 && (
          <>
            <button
              onClick={() => setShowDone((s) => !s)}
              className="mt-2 flex w-full select-none items-center gap-2 px-2 pb-1.5 pt-[18px] text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted"
            >
              <Icon
                name="chevronDown"
                size={11}
                strokeWidth={2.5}
                className={`text-faint transition-transform ${showDone ? '' : '-rotate-90'}`}
              />
              Completed · {done.length}
              <span className="h-px flex-1 bg-line-soft" />
            </button>
            {showDone &&
              done.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))}
          </>
        )}
      </div>
    </section>
  )
}
