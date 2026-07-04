import { useState } from 'react'

// Quick-add, pinned at the top of the list. Type, hit Enter, keep typing —
// focus is retained so several tasks can be added in a row without the mouse.
export default function AddTaskInput({ onAdd }) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (!value.trim()) return
    onAdd(value)
    setValue('')
  }

  return (
    <div className="mx-2 mb-2 flex items-center gap-3 rounded-[11px] border-[1.5px] border-line bg-window px-3.5 py-[11px] focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_16%,transparent)]">
      <span
        className="h-5 w-5 flex-none rounded-full border-2 border-dashed"
        style={{ borderColor: 'color-mix(in srgb, var(--accent) 55%, var(--faint))' }}
        aria-hidden="true"
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Add a task…"
        aria-label="Add a task"
        className="flex-1 bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-faint"
      />
      <span className="whitespace-nowrap rounded-md border border-line bg-sidebar px-[7px] py-0.5 text-[0.68rem] text-muted max-[680px]:hidden">
        ⏎ Enter
      </span>
    </div>
  )
}
