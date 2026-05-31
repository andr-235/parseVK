import { useState } from 'react'
import { CheckCircle, Flag, HelpCircle, Circle } from 'lucide-react'
import { useClickOutside } from '../../../../shared/hooks/useClickOutside'
import { ALL_STATUSES, statusColors, type Status } from '../../../../types/comments'

const statusIcons: Record<Status, typeof CheckCircle> = {
  Чисто: CheckCircle,
  Нарушение: Flag,
  Проверка: HelpCircle,
  Новый: Circle,
}

export type StatusCellProps = {
  status: Status
  onChange: (s: Status) => void
}

export function StatusCell({ status, onChange }: StatusCellProps) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))
  const Icon = statusIcons[status]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        aria-label={`Статус: ${status}. Нажмите для смены`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex min-h-[44px] items-center gap-1 rounded-sm px-1 py-1.5 text-sm font-medium hover:bg-bg-hover transition-colors duration-150 ${statusColors[status]}`}
      >
        <Icon size={14} />
        {status}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="opacity-60">
          <path d="M0 2l4 4 4-4z" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[100px] rounded-md border border-border bg-bg-panel py-1 text-sm"
          role="listbox"
          aria-label="Выберите статус"
        >
          {ALL_STATUSES.map((s) => {
            const ItemIcon = statusIcons[s]
            return (
              <button
                key={s}
                role="option"
                aria-selected={s === status}
                onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false) }}
                className={`flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-bg-hover transition-colors duration-150 ${s === status ? 'bg-accent-soft' : ''} ${statusColors[s]}`}
              >
                <ItemIcon size={10} />
                {s}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
