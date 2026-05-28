import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import type { RefObject } from 'react'
import { Search, RotateCcw, ArrowUpDown, X, Plus, MapPin, Users as UsersIcon } from 'lucide-react'
import type { IRegionGroupSearchItem } from '@/types/common'
import type { TableColumn, TableSortState } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useTableSorting } from '@/hooks/common'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// --- Formatters & Utilities ---
const formatCityTitle = (group: IRegionGroupSearchItem): string => {
  const city = group.city
  if (!city) return '—'
  if (typeof city === 'string') return city
  if (typeof city === 'object' && city !== null) {
    if ('title' in city && typeof city.title === 'string') return city.title
    if ('name' in city && typeof city.name === 'string') return city.name
  }
  return '—'
}

const renderMembersCount = (group: IRegionGroupSearchItem): string => {
  if (typeof group.members_count === 'number') {
    return group.members_count.toLocaleString('ru-RU')
  }
  return '—'
}

const groupColumns: TableColumn<IRegionGroupSearchItem>[] = [
  {
    key: 'name',
    header: 'Название',
    sortable: true,
    sortValue: (item) => item.name?.toLowerCase() ?? '',
  },
  {
    key: 'members_count',
    header: 'Участники',
    sortable: true,
    sortValue: (item) => item.members_count ?? null,
  },
  {
    key: 'city',
    header: 'Город',
    sortable: true,
    sortValue: (item) => {
      const city = item.city
      if (!city) return ''
      if (typeof city === 'string') return city.toLowerCase()
      if (typeof city === 'object') {
        if ('title' in city && typeof city.title === 'string') return city.title.toLowerCase()
        if ('name' in city && typeof city.name === 'string') return city.name.toLowerCase()
      }
      return ''
    },
  },
]

// --- Selection Hook ---
const useGroupSelection = (
  results: IRegionGroupSearchItem[],
  sortedResults: IRegionGroupSearchItem[]
) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set<number>())
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev
      const next = new Set<number>()
      for (const group of results) {
        if (prev.has(group.id)) next.add(group.id)
      }
      return next.size === prev.size ? prev : next
    })
  }, [results])

  const resultsMap = useMemo(() => {
    const map = new Map<number, IRegionGroupSearchItem>()
    results.forEach((group) => map.set(group.id, group))
    return map
  }, [results])

  const hasResults = sortedResults.length > 0
  const isAllSelected = hasResults && sortedResults.every((group) => selectedIds.has(group.id))
  const hasSelection = selectedIds.size > 0
  const isSelectionPartial = hasSelection && !isAllSelected
  const selectionSize = selectedIds.size

  const selectedGroups = useMemo(() => {
    if (!hasSelection) return []
    const items: IRegionGroupSearchItem[] = []
    selectedIds.forEach((id) => {
      const group = resultsMap.get(id)
      if (group) items.push(group)
    })
    return items
  }, [hasSelection, resultsMap, selectedIds])

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSelectionPartial
    }
  }, [isSelectionPartial])

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (!hasResults) {
        setSelectedIds(new Set<number>())
        return
      }
      if (checked) {
        const next = new Set<number>()
        sortedResults.forEach((group) => next.add(group.id))
        setSelectedIds(next)
      } else {
        setSelectedIds(new Set<number>())
      }
    },
    [hasResults, sortedResults]
  )

  const toggleSelection = useCallback((groupId: number) => {
    setSelectedIds((prev) => {
      const next = new Set<number>(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set<number>())
  }, [])

  const removeFromSelection = useCallback((groupId: number) => {
    setSelectedIds((prev) => {
      if (!prev.has(groupId)) return prev
      const next = new Set<number>(prev)
      next.delete(groupId)
      return next
    })
  }, [])

  return {
    selectedIds,
    selectAllRef,
    isAllSelected,
    hasSelection,
    isSelectionPartial,
    selectionSize,
    selectedGroups,
    toggleSelectAll,
    toggleSelection,
    clearSelection,
    removeFromSelection,
  }
}

// --- Actions Hook ---
interface UseGroupActionsProps {
  results: IRegionGroupSearchItem[]
  selectedGroups: IRegionGroupSearchItem[]
  hasSelection: boolean
  onAddGroup: (group: IRegionGroupSearchItem) => Promise<boolean> | boolean
  onAddSelected: (
    groups: IRegionGroupSearchItem[]
  ) => Promise<{ successCount: number; failedIds: number[] }>
  onRemoveGroup: (vkGroupId: number) => void
  onRemoveFromSelection: (groupId: number) => void
  onClearSelection: () => void
}

const useGroupActions = ({
  results,
  selectedGroups,
  hasSelection,
  onAddGroup,
  onAddSelected,
  onRemoveGroup,
  onRemoveFromSelection,
  onClearSelection,
}: UseGroupActionsProps) => {
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  const handleAddGroups = useCallback(async () => {
    const groupsToAdd = hasSelection ? selectedGroups : results
    if (!groupsToAdd.length) return

    setIsBulkAdding(true)
    try {
      const result = await onAddSelected(groupsToAdd)
      const failedIds = result?.failedIds ?? []

      if (failedIds.length === 0) {
        onClearSelection()
      } else {
        onClearSelection()
        failedIds.forEach((id) => onRemoveFromSelection(id))
      }
    } finally {
      setIsBulkAdding(false)
    }
  }, [
    hasSelection,
    selectedGroups,
    results,
    onAddSelected,
    onClearSelection,
    onRemoveFromSelection,
  ])

  const handleAddSingleGroup = useCallback(
    async (group: IRegionGroupSearchItem) => {
      const success = await onAddGroup(group)
      if (success) {
        onRemoveFromSelection(group.id)
      }
    },
    [onAddGroup, onRemoveFromSelection]
  )

  const handleRemoveSingleGroup = useCallback(
    (groupId: number) => {
      onRemoveFromSelection(groupId)
      onRemoveGroup(groupId)
    },
    [onRemoveGroup, onRemoveFromSelection]
  )

  return {
    isBulkAdding,
    handleAddGroups,
    handleAddSingleGroup,
    handleRemoveSingleGroup,
  }
}

// --- Header Subcomponent ---
interface RegionSearchHeaderProps {
  total: number
  hasResults: boolean
  isLoading: boolean
  canSearch: boolean
  onSearch: () => Promise<void> | void
  onReset?: () => void
}

const RegionSearchHeader = ({
  total,
  hasResults,
  isLoading,
  canSearch,
  onSearch,
  onReset,
}: RegionSearchHeaderProps) => {
  const handleSearchClick = async () => {
    if (!canSearch) return
    await onSearch()
  }

  const handleResetClick = () => {
    if (!isLoading) {
      onReset?.()
    }
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border bg-background-sidebar/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="space-y-1.5">
        <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
          Поиск по региону
        </h2>
        <p className="text-sm text-text-secondary">
          Поиск групп в регионе{' '}
          <span className="font-mono-accent text-primary">«Еврейская автономная область»</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSearchClick}
          disabled={!canSearch}
          size="sm"
          className="h-10 min-w-[140px] bg-primary font-semibold text-text-light hover:bg-primary/90 transition-all duration-200 active:translate-y-px shadow-soft-sm hover:shadow-soft-md"
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? <Spinner className="size-4" /> : <Search className="size-4" />}
            Найти группы
          </span>
        </Button>

        {(total > 0 || hasResults) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading}
            onClick={handleResetClick}
            title="Очистить результаты"
            className="h-10 text-text-secondary transition-colors duration-200 hover:bg-background-primary hover:text-text-light"
          >
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// --- Controls Subcomponent ---
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

const RegionSearchControls = ({
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

// --- Individual Card Subcomponent ---
interface RegionGroupCardProps {
  group: IRegionGroupSearchItem
  isSelected: boolean
  isBulkAdding: boolean
  onToggleSelection: (groupId: number) => void
  onAddGroup: (group: IRegionGroupSearchItem) => void | Promise<void>
  onRemoveGroup: (groupId: number) => void
}

const RegionGroupCard = memo(function RegionGroupCard({
  group,
  isSelected,
  isBulkAdding,
  onToggleSelection,
  onAddGroup,
  onRemoveGroup,
}: RegionGroupCardProps) {
  return (
    <div className="group relative">
      <div
        className={`relative flex flex-col gap-3 rounded-lg border p-4 transition-all duration-300 ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-soft-sm'
            : 'border-border bg-background-secondary hover:border-slate-700 hover:bg-background-sidebar/50'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Custom checkbox */}
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(group.id)}
              aria-label={`Выбрать группу ${group.name}`}
              className="peer size-4 shrink-0 cursor-pointer appearance-none rounded border border-border bg-background-primary transition-all duration-200 checked:border-primary checked:bg-primary focus:ring-2 focus:ring-primary/20"
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

          <div className="min-w-0 flex-1 space-y-1">
            <a
              href={`https://vk.com/${group.screen_name ?? `club${group.id}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-monitoring-display text-sm font-medium leading-tight text-text-light transition-colors duration-200 hover:text-primary hover:underline"
              title={group.name}
            >
              {group.name}
            </a>
            <div className="truncate font-mono-accent text-xs text-text-secondary">
              vk.com/{group.screen_name ?? `club${group.id}`}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 size-8 text-text-secondary transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRemoveGroup(group.id)}
            disabled={isBulkAdding}
            aria-label="Удалить из списка результатов"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2" title="Участники">
            <div className="flex size-6 items-center justify-center rounded-md bg-background-sidebar text-text-secondary">
              <UsersIcon className="size-3.5" />
            </div>
            <span className="font-mono-accent text-xs font-medium text-text-secondary">
              {renderMembersCount(group)}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate" title="Город">
            <MapPin className="size-3.5 shrink-0 text-text-secondary" />
            <span className="truncate font-mono-accent text-xs text-text-secondary">
              {formatCityTitle(group)}
            </span>
          </div>
        </div>

        {/* Add button */}
        <Button
          size="sm"
          className="w-full h-8 bg-primary font-semibold text-text-light hover:bg-primary/90 transition-all duration-200 active:translate-y-px shadow-soft-sm hover:shadow-soft-md"
          onClick={() => {
            void onAddGroup(group)
          }}
          disabled={isBulkAdding}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Plus className="size-3" />
            Добавить
          </span>
        </Button>
      </div>
    </div>
  )
})

// --- Grid Subcomponent ---
interface RegionResultsGridProps {
  sortedResults: IRegionGroupSearchItem[]
  selectedIds: Set<number>
  isBulkAdding: boolean
  onToggleSelection: (groupId: number) => void
  onAddGroup: (group: IRegionGroupSearchItem) => void | Promise<void>
  onRemoveGroup: (groupId: number) => void
}

const RegionResultsGrid = ({
  sortedResults,
  selectedIds,
  isBulkAdding,
  onToggleSelection,
  onAddGroup,
  onRemoveGroup,
}: RegionResultsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedResults.map((group, index) => (
        <div
          key={group.id}
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: index < 12 ? `${index * 40}ms` : '0ms' }}
        >
          <RegionGroupCard
            group={group}
            isSelected={selectedIds.has(group.id)}
            isBulkAdding={isBulkAdding}
            onToggleSelection={onToggleSelection}
            onAddGroup={onAddGroup}
            onRemoveGroup={onRemoveGroup}
          />
        </div>
      ))}
    </div>
  )
}

// --- Main Exported Component ---
interface RegionGroupsSearchCardProps {
  total: number
  results: IRegionGroupSearchItem[]
  isLoading: boolean
  error: string | null
  onSearch: () => Promise<void> | void
  onAddGroup: (group: IRegionGroupSearchItem) => Promise<boolean> | boolean
  onAddSelected: (
    groups: IRegionGroupSearchItem[]
  ) => Promise<{ successCount: number; failedIds: number[] }>
  onRemoveGroup: (vkGroupId: number) => void
  onReset?: () => void
}

function RegionGroupsSearchCard({
  total,
  results,
  isLoading,
  error,
  onSearch,
  onAddGroup,
  onAddSelected,
  onRemoveGroup,
  onReset,
}: RegionGroupsSearchCardProps) {
  const {
    sortedItems: sortedResults,
    sortState,
    requestSort,
  } = useTableSorting(results, groupColumns, {
    initialKey: 'members_count',
    initialDirection: 'desc',
  })

  const selection = useGroupSelection(results, sortedResults)

  const actions = useGroupActions({
    results,
    selectedGroups: selection.selectedGroups,
    hasSelection: selection.hasSelection,
    onAddGroup,
    onAddSelected,
    onRemoveGroup,
    onRemoveFromSelection: selection.removeFromSelection,
    onClearSelection: selection.clearSelection,
  })

  const hasResults = sortedResults.length > 0
  const canSearch = !isLoading && !actions.isBulkAdding

  const handleReset = () => {
    onReset?.()
    selection.clearSelection()
  }

  const currentSortLabel =
    groupColumns.find((c) => c.key === sortState?.key)?.header || 'Сортировка'

  return (
    <Card className="relative overflow-hidden rounded-card border border-border bg-background-secondary shadow-soft-sm">
      <RegionSearchHeader
        total={total}
        hasResults={hasResults}
        isLoading={isLoading}
        canSearch={canSearch}
        onSearch={onSearch}
        onReset={handleReset}
      />

      <CardContent className="p-0">
        {error && (
          <div className="animate-in slide-in-from-top-2 fade-in-0 m-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="font-mono-accent">⚠</span> {error}
          </div>
        )}

        {isLoading && !hasResults && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="mr-2" />
            <span className="font-mono-accent text-sm text-text-secondary">
              Выполняется поиск групп...
            </span>
          </div>
        )}

        {!isLoading && !hasResults && total > 0 && !error && (
          <div className="p-6 text-center text-sm text-text-secondary">
            Все найденные группы уже добавлены в базу данных.
          </div>
        )}

        {!isLoading && !hasResults && total === 0 && !error && (
          <div className="p-6 text-center text-sm text-text-secondary">
            В регионе пока не найдено сообществ, отсутствующих в базе.
          </div>
        )}

        {hasResults && (
          <div className="flex flex-col">
            <RegionSearchControls
              selectAllRef={selection.selectAllRef}
              isAllSelected={selection.isAllSelected}
              hasResults={hasResults}
              isLoading={isLoading}
              isBulkAdding={actions.isBulkAdding}
              hasSelection={selection.hasSelection}
              selectionSize={selection.selectionSize}
              resultsLength={results.length}
              columns={groupColumns}
              sortState={sortState}
              currentSortLabel={currentSortLabel}
              onToggleSelectAll={selection.toggleSelectAll}
              onRequestSort={requestSort}
              onAddGroups={actions.handleAddGroups}
            />

            <RegionResultsGrid
              sortedResults={sortedResults}
              selectedIds={selection.selectedIds}
              isBulkAdding={actions.isBulkAdding}
              onToggleSelection={selection.toggleSelection}
              onAddGroup={actions.handleAddSingleGroup}
              onRemoveGroup={actions.handleRemoveSingleGroup}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RegionGroupsSearchCard
