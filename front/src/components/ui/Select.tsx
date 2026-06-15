import { useState, useRef, useCallback } from 'react'
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
  const [focusIdx, setFocusIdx] = useState(-1)
  const ref = useClickOutside(() => { setOpen(false); setFocusIdx(-1) })
  const listRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => { setOpen(false); setFocusIdx(-1) }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setFocusIdx(0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusIdx((prev) => Math.min(prev + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusIdx((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusIdx >= 0 && focusIdx < options.length) {
          onChange(options[focusIdx])
          close()
        }
        break
      case 'Tab':
        close()
        break
    }
  }, [open, options, onChange, close, focusIdx])

  return (
    <div className="relative" ref={ref}>
      <button
        id={id}
        type="button"
        onClick={() => { setOpen(!open); setFocusIdx(open ? -1 : 0) }}
        onKeyDown={handleKeyDown}
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
          ref={listRef}
          className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-md border border-border bg-bg-panel py-1 text-sm"
          role="listbox"
          aria-label={label}
          aria-activedescendant={focusIdx >= 0 ? `select-opt-${id ?? label}-${focusIdx}` : undefined}
        >
          {options.map((o, i) => (
            <button
              key={o}
              id={`select-opt-${id ?? label}-${i}`}
              type="button"
              role="option"
              aria-selected={o === value}
              tabIndex={-1}
              onMouseEnter={() => setFocusIdx(i)}
              onClick={() => { onChange(o); close() }}
              className={`flex w-full items-center px-2.5 py-1.5 text-left transition-colors duration-150 ${focusIdx === i ? 'bg-bg-hover' : ''} ${o === value ? 'bg-accent-soft text-accent font-medium' : 'text-text-secondary'}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
