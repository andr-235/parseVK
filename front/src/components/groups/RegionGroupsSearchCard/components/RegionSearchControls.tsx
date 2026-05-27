import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ArrowUpDown } from 'lucide-react'
import type { TableColumn, TableSortState } from '@/types'
import type { IRegionGroupSearchItem } from '@/types/common'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RegionSearchControlsProps {
  selectAllRef: RefObject<HTMLInputElement | null>
  isAllSelected: boolean
  hasResults: boolean
  isLoading: boolean
  isBulkAdding: boolean
  hasSelection: boolean
  selectionSize: number
  resultsLength: number
  columns: TableColumn<IRegionGroupSearchItem>[]
  sortState: TableSortState | null
  currentSortLabel: string
  onToggleSelectAll: (checked: boolean) => void
  onRequestSort: (key: string) => void
  onAddGroups: () => void
}

export const RegionSearchControls = ({
  selectAllRef,
  isAllSelected,
  hasResults,
  isLoading,
  isBulkAdding,
  hasSelection,
  selectionSize,
  resultsLength,
  columns,
  sortState,
  currentSortLabel,
  onToggleSelectAll,
  onRequestSort,
  onAddGroups,
}: RegionSearchControlsProps) => {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background-sidebar/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <label className="flex cursor-pointer select-none items-center gap-2.5">
          <div className="relative">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={isAllSelected}
              disabled={!hasResults || isLoading}
              onChange={(event) => onToggleSelectAll(event.target.checked)}
              aria-label="Выбрать все найденные сообщества"
              className="peer size-4 cursor-pointer appearance-none rounded border border-border bg-background-primary transition-all duration-200 checked:border-primary checked:bg-primary focus:ring-2 focus:ring-primary/20"
            />
            <svg
              className="pointer-events-none absolute left-0.5 top-0.5 size-3 text-text-light opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-monitoring-display text-sm font-medium text-text-light">
            Выбрать все
          </span>
        </label>
        <span className="hidden font-mono-accent text-xs text-text-secondary sm:inline">
          ({resultsLength})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 border-border bg-background-primary text-text-secondary hover:border-primary/50 hover:bg-background-sidebar hover:text-text-light"
            >
              <ArrowUpDown className="size-3.5" />
              <span className="max-w-[100px] truncate text-xs">{currentSortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border border-border bg-background-secondary shadow-soft-lg"
          >
            {columns
              .filter((c) => c.sortable)
              .map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  onClick={() => onRequestSort(col.key)}
                  className="text-text-secondary hover:bg-background-primary hover:text-text-light"
                >
                  {col.header}
                  {sortState?.key === col.key && (
                    <span className="ml-auto font-mono-accent text-xs text-primary">
                      {sortState.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          size="sm"
          className="h-8 bg-primary text-xs font-semibold text-text-light hover:bg-primary/90 transition-all duration-200 active:translate-y-px shadow-soft-sm hover:shadow-soft-md"
          disabled={isLoading || isBulkAdding || !hasResults}
          onClick={onAddGroups}
        >
          <span className="flex items-center gap-1.5">
            {isBulkAdding && <Spinner className="size-3" />}
            {hasSelection ? `Импортировать (${selectionSize})` : 'Импортировать все'}
          </span>
        </Button>
      </div>
    </div>
  )
}
