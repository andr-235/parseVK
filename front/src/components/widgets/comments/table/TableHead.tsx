import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Checkbox } from '../../../ui'
import type { SortKey, SortConfig } from './CommentsTable'

export type TableHeadProps = {
  allChecked: boolean
  onToggleAll: () => void
  sort: SortConfig
  onSort: (key: SortKey) => void
}

const columns: { key: SortKey; label: string; hide: string }[] = [
  { key: 'text', label: 'Текст', hide: '' },
  { key: 'group', label: 'Группа', hide: 'hidden sm:table-cell' },
  { key: 'author', label: 'Автор', hide: 'hidden sm:table-cell' },
  { key: 'date', label: 'Дата', hide: 'hidden md:table-cell' },
  { key: 'status', label: 'Статус', hide: '' },
]

export function TableHead({ allChecked, onToggleAll, sort, onSort }: TableHeadProps) {
  return (
    <thead>
      <tr className="border-b border-border bg-bg-sidebar text-left text-xs font-medium uppercase tracking-wider text-text-muted">
        <th className="w-10 px-3 py-2">
          <Checkbox checked={allChecked} onChange={onToggleAll} aria-label="Выбрать все" />
        </th>
        {columns.map((col) => {
          const active = sort.key === col.key
          const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending' as const) : 'none' as const
          const SortIcon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
          return (
            <th
              key={col.key}
              className={`${col.hide} px-3 py-2 ${col.key === 'text' ? '' : 'w-28'}`}
              aria-sort={ariaSort}
            >
              <button
                onClick={() => onSort(col.key)}
                className="flex min-h-[44px] items-center gap-1 rounded-sm py-1.5 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-150"
              >
                {col.label}
                <SortIcon size={12} className={active ? '' : 'opacity-30'} />
              </button>
            </th>
          )
        })}
        <th className="px-3 py-2 w-28" />
      </tr>
    </thead>
  )
}
