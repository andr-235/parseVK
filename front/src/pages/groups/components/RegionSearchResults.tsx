import { ArrowUpDown } from 'lucide-react'
import type { IRegionGroupSearchItem, TableSortState } from '@/shared/types'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { RegionGroupRow } from './RegionGroupRow'
import { regionSortColumns } from '../utils/regionSearchHelpers'

interface RegionSearchResultsProps {
  results: IRegionGroupSearchItem[]
  sortedResults: IRegionGroupSearchItem[]
  sortState: TableSortState | null
  selectedIds: Set<number>
  isAllSelected: boolean
  isSelectionPartial: boolean
  hasSelection: boolean
  isLoading: boolean
  isBulkAdding: boolean
  onToggleSelectAll: (checked: boolean) => void
  onToggleSelection: (id: number) => void
  onAddSingle: (group: IRegionGroupSearchItem) => void
  onAddSelected: () => void
  onRemove: (id: number) => void
  onRequestSort: (key: string) => void
}

export function RegionSearchResults({
  results,
  sortedResults,
  sortState,
  selectedIds,
  isAllSelected,
  isSelectionPartial,
  hasSelection,
  isLoading,
  isBulkAdding,
  onToggleSelectAll,
  onToggleSelection,
  onAddSingle,
  onAddSelected,
  onRemove,
  onRequestSort,
}: RegionSearchResultsProps) {
  const currentSortLabel = regionSortColumns.find((c) => c.key === sortState?.key)?.header || 'Сортировка'

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              disabled={isLoading || isBulkAdding}
              onChange={(e) => onToggleSelectAll(e.target.checked)}
              ref={(el) => {
                if (el) el.indeterminate = isSelectionPartial
              }}
              aria-label="Выбрать все"
              className="peer size-4 cursor-pointer appearance-none rounded border border-border/60 bg-background-primary transition-colors checked:border-accent-primary checked:bg-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            />
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-0.5 top-0.5 size-3 text-text-light opacity-0 transition-opacity peer-checked:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs text-text-secondary">
            {results.length} найдено
            {hasSelection && ` \u00B7 выбрано ${selectedIds.size}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 px-2.5 text-xs text-text-secondary hover:bg-background-primary hover:text-text-light"
              >
                <ArrowUpDown className="size-3" />
                {currentSortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border border-border/60 bg-background-secondary shadow-soft-sm"
            >
              {regionSortColumns.filter((c) => c.sortable).map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  onClick={() => onRequestSort(col.key)}
                  className="cursor-pointer text-xs text-text-secondary hover:bg-background-primary hover:text-text-light"
                >
                  {col.header}
                  {sortState?.key === col.key && (
                    <span className="ml-auto font-mono-accent text-accent-primary">
                      {sortState.direction === 'asc' ? ' \u2191' : ' \u2193'}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="h-9 bg-accent-primary text-xs text-text-light hover:bg-accent-primary/90"
            disabled={isLoading || isBulkAdding || sortedResults.length === 0}
            onClick={onAddSelected}
          >
            {isBulkAdding && <Spinner className="mr-1 size-3" />}
            {hasSelection ? `Импорт (${selectedIds.size})` : 'Импорт все'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedResults.map((group) => (
          <RegionGroupRow
            key={group.id}
            group={group}
            selected={selectedIds.has(group.id)}
            onToggle={onToggleSelection}
            onAdd={onAddSingle}
            onRemove={onRemove}
            disabled={isBulkAdding}
          />
        ))}
      </div>
    </div>
  )
}
