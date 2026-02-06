import type { RefObject } from 'react'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { ArrowUpDown } from 'lucide-react'
import type { TableColumn, TableSortState } from '@/types'
import type { IRegionGroupSearchItem } from '@/shared/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

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
    <div className="flex flex-col gap-3 border-b border-white/5 bg-slate-800/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <label className="flex cursor-pointer select-none items-center gap-2.5">
          <div className="relative">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={isAllSelected}
              disabled={!hasResults || isLoading}
              onChange={(event) => onToggleSelectAll(event.target.checked)}
              className="peer size-4 cursor-pointer appearance-none rounded border border-white/20 bg-slate-800/50 transition-all duration-200 checked:border-cyan-500 checked:bg-cyan-500 focus:ring-2 focus:ring-cyan-400/20"
            />
            <svg
              className="pointer-events-none absolute left-0.5 top-0.5 size-3 text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-monitoring-display text-sm font-medium text-white">
            Выбрать все
          </span>
        </label>
        <span className="hidden font-mono-accent text-xs text-slate-500 sm:inline">
          ({resultsLength})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 border-white/10 bg-slate-800/50 text-slate-300 hover:border-cyan-400/50 hover:bg-slate-800 hover:text-white"
            >
              <ArrowUpDown className="size-3.5" />
              <span className="max-w-[100px] truncate text-xs">{currentSortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-white/10 bg-slate-900/95 backdrop-blur-xl"
          >
            {columns
              .filter((c) => c.sortable)
              .map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  onClick={() => onRequestSort(col.key)}
                  className="text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {col.header}
                  {sortState?.key === col.key && (
                    <span className="ml-auto font-mono-accent text-xs text-cyan-400">
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
          className="group relative h-8 overflow-hidden bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30"
          disabled={isLoading || isBulkAdding || !hasResults}
          onClick={onAddGroups}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative flex items-center gap-1.5">
            {isBulkAdding && <Spinner className="size-3" />}
            {hasSelection ? `Добавить (${selectionSize})` : 'Добавить все'}
          </span>
        </Button>
      </div>
    </div>
  )
}
