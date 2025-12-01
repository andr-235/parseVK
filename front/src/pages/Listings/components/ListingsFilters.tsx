import { Input } from '@/components/ui/input'
import { Search, SlidersHorizontal } from 'lucide-react'
import { formatSourceLabel } from '@/utils/listingsUtils'

interface ListingsFiltersProps {
  searchTerm: string
  appliedSearch: string
  sourceFilter: string
  archivedFilter: boolean
  pageSize: number
  filterOptions: string[]
  PAGE_SIZE_OPTIONS: number[]
  summaryText: string
  onSearchChange: (value: string) => void
  onApplySearch: () => void
  onResetSearch: () => void
  onSourceChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  onArchivedChange: (archived: boolean) => void
  onPageSizeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

const selectClass =
  'h-10 rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary'

export const ListingsFilters = ({
  searchTerm,
  appliedSearch,
  sourceFilter,
  archivedFilter,
  pageSize,
  filterOptions,
  PAGE_SIZE_OPTIONS,
  summaryText,
  onSearchChange,
  onApplySearch,
  onResetSearch,
  onSourceChange,
  onArchivedChange,
  onPageSizeChange,
}: ListingsFiltersProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background-secondary p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-text-secondary">
        <SlidersHorizontal className="h-4 w-4" />
        Фильтры
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApplySearch()}
            placeholder="Поиск по адресу, описанию..."
            className="bg-background-primary pl-9"
          />
          {searchTerm && (
            <button
              onClick={onResetSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary hover:text-accent-primary"
            >
              Сбросить
            </button>
          )}
        </div>

        <select value={sourceFilter} onChange={onSourceChange} className={`${selectClass} min-w-[160px]`}>
          {filterOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? 'Все источники' : formatSourceLabel(option)}
            </option>
          ))}
        </select>

        <select
          value={archivedFilter ? 'archived' : 'active'}
          onChange={(e) => onArchivedChange(e.target.value === 'archived')}
          className={`${selectClass} min-w-[140px]`}
        >
          <option value="active">Активные</option>
          <option value="archived">В архиве</option>
        </select>

        <select value={pageSize} onChange={onPageSizeChange} className={`${selectClass} w-[120px]`}>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} стр.
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-4 text-sm">
        <div className="text-text-secondary">{summaryText}</div>
        {appliedSearch && (
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">Результаты поиска:</span>
            <span className="rounded bg-accent-primary/10 px-2 py-0.5 font-medium text-accent-primary">
              {appliedSearch}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

