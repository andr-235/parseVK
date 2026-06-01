import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Checkbox } from '../../ui/Checkbox'
import type { Column } from './constants'

export type TableHeadProps = {
  columns: Column[]
  sort?: { key: string; dir: 'asc' | 'desc' }
  onSort?: (key: string) => void
  allChecked?: boolean
  onToggleAll?: () => void
}

export function TableHead({ columns, sort, onSort, allChecked, onToggleAll }: TableHeadProps) {
  return (
    <thead>
      <tr className="border-b border-border bg-bg-sidebar text-left text-xs font-medium uppercase tracking-wider text-text-muted">
        {allChecked !== undefined && onToggleAll && (
          <th className="w-10 px-3 py-2">
            <Checkbox checked={allChecked} onChange={onToggleAll} aria-label="Выбрать все" />
          </th>
        )}
        {columns.map((col) => {
          const active = sort && sort.key === col.key
          const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending' as const) : 'none' as const
          const SortIcon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
          return (
            <th
              key={col.key}
              className={`${col.hide ?? ''} px-3 py-2 ${col.className ?? ''}`}
              aria-sort={col.sortable ? ariaSort : undefined}
            >
              {col.sortable && onSort ? (
                <button
                  onClick={() => onSort(col.key)}
                  className="flex min-h-[44px] items-center gap-1 rounded-sm py-1.5 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-150"
                >
                  {col.label}
                  <SortIcon size={12} className={active ? '' : 'opacity-30'} />
                </button>
              ) : (
                col.label
              )}
            </th>
          )
        })}
        <th className="px-3 py-2 w-28" />
      </tr>
    </thead>
  )
}
