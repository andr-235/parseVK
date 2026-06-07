import { useState } from 'react'
import { useClickOutside } from '../../shared/hooks/useClickOutside'

export type SelectProps<T extends string> = {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  label: string
  id?: string
}

export function Select<T extends string>({ value, options, onChange, label, id }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))

  return (
    <div className="relative" ref={ref}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-8 items-center gap-1 rounded-md border border-border bg-bg-main px-2 text-sm text-text-secondary hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-150"
      >
        {value}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="opacity-60 shrink-0">
          <path d="M0 2l4 4 4-4z" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-md border border-border bg-bg-panel py-1 text-sm"
          role="listbox"
          aria-label={label}
        >
          {options.map((o) => (
            <button
              key={o}
              type="button"
              role="option"
              aria-selected={o === value}
              onClick={() => { onChange(o); setOpen(false) }}
              className={`flex w-full items-center px-2.5 py-1.5 text-left hover:bg-bg-hover transition-colors duration-150 ${o === value ? 'bg-accent-soft text-accent font-medium' : 'text-text-secondary'}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
