import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IRegionGroupSearchItem } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { useTableSorting } from '@/shared/hooks'
import type { TableColumn } from '@/types'
import { Spinner } from '@/shared/ui/spinner'
import { Card, CardContent } from '@/shared/ui/card'
import { Search, X, RotateCcw, ArrowUpDown, Plus, MapPin, Users as UsersIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

interface RegionGroupCardProps {
  group: IRegionGroupSearchItem
  isSelected: boolean
  isBulkAdding: boolean
  onToggleSelection: (groupId: number) => void
  onAddGroup: (group: IRegionGroupSearchItem) => void | Promise<void>
  onRemoveGroup: (groupId: number) => void
  formatCityTitle: (group: IRegionGroupSearchItem) => string
  renderMembersCount: (group: IRegionGroupSearchItem) => string
}

const RegionGroupCard = memo(function RegionGroupCard({
  group,
  isSelected,
  isBulkAdding,
  onToggleSelection,
  onAddGroup,
  onRemoveGroup,
  formatCityTitle,
  renderMembersCount,
}: RegionGroupCardProps) {
  return (
    <div className="group relative">
      {/* Subtle glow on selection */}
      {isSelected && (
        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-lg" />
      )}

      <div
        className={`relative flex flex-col gap-3 rounded-lg border p-4 transition-all duration-300 ${
          isSelected
            ? 'border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
            : 'border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-800/50'
        }`}
      >
        {/* Top border glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start gap-3">
          {/* Custom checkbox */}
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(group.id)}
              className="peer size-4 shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-slate-800/50 transition-all duration-200 checked:border-cyan-500 checked:bg-cyan-500 focus:ring-2 focus:ring-cyan-400/20"
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

          <div className="min-w-0 flex-1 space-y-1">
            <a
              href={`https://vk.com/${group.screen_name ?? `club${group.id}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-monitoring-display text-sm font-medium leading-tight text-white transition-colors duration-200 hover:text-cyan-400 hover:underline"
              title={group.name}
            >
              {group.name}
            </a>
            <div className="truncate font-mono-accent text-xs text-slate-500">
              vk.com/{group.screen_name ?? `club${group.id}`}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-2 size-6 text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => onRemoveGroup(group.id)}
            disabled={isBulkAdding}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2" title="Участники">
            <div className="flex size-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
              <UsersIcon className="size-3.5" />
            </div>
            <span className="font-mono-accent text-xs font-medium text-slate-300">
              {renderMembersCount(group)}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate" title="Город">
            <MapPin className="size-3.5 shrink-0 text-slate-500" />
            <span className="truncate font-mono-accent text-xs text-slate-400">
              {formatCityTitle(group)}
            </span>
          </div>
        </div>

        {/* Add button */}
        <Button
          size="sm"
          className="group/btn relative h-8 overflow-hidden bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30"
          onClick={() => {
            void onAddGroup(group)
          }}
          disabled={isBulkAdding}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
          <span className="relative flex items-center justify-center gap-1.5">
            <Plus className="size-3" />
            Добавить
          </span>
        </Button>
      </div>
    </div>
  )
})

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
  const formatCityTitle = useCallback((group: IRegionGroupSearchItem): string => {
    const city = group.city
    if (!city) return '—'
    if (typeof city === 'string') return city
    if (typeof city === 'object' && city !== null) {
      if ('title' in city && typeof city.title === 'string') return city.title
      if ('name' in city && typeof city.name === 'string') return city.name
    }
    return '—'
  }, [])

  const renderMembersCount = useCallback((group: IRegionGroupSearchItem) => {
    if (typeof group.members_count === 'number') {
      return group.members_count.toLocaleString('ru-RU')
    }
    return '—'
  }, [])

  const columns = useMemo<TableColumn<IRegionGroupSearchItem>[]>(
    () => [
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
    ],
    []
  )

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set<number>())
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  const {
    sortedItems: sortedResults,
    sortState,
    requestSort,
  } = useTableSorting(results, columns, {
    initialKey: 'members_count',
    initialDirection: 'desc',
  })

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

  const isAllSelected =
    sortedResults.length > 0 && sortedResults.every((group) => selectedIds.has(group.id))
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

  const hasResults = sortedResults.length > 0
  const canSearch = !isLoading && !isBulkAdding

  const handleSearchClick = async () => {
    if (!canSearch) return
    await onSearch()
  }

  const handleResetClick = () => {
    if (!isLoading) {
      onReset?.()
      setSelectedIds(new Set<number>())
    }
  }

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

  const handleAddGroups = useCallback(async () => {
    const groupsToAdd = hasSelection ? selectedGroups : results
    if (!groupsToAdd.length) return

    setIsBulkAdding(true)
    try {
      const result = await onAddSelected(groupsToAdd)
      const failedIds = result?.failedIds ?? []
      setSelectedIds(() => (failedIds.length ? new Set<number>(failedIds) : new Set<number>()))
    } finally {
      setIsBulkAdding(false)
    }
  }, [hasSelection, onAddSelected, results, selectedGroups])

  const handleAddSingleGroup = useCallback(
    async (group: IRegionGroupSearchItem) => {
      const success = await onAddGroup(group)
      if (success) {
        setSelectedIds((prev) => {
          if (!prev.has(group.id)) return prev
          const next = new Set<number>(prev)
          next.delete(group.id)
          return next
        })
      }
    },
    [onAddGroup]
  )

  const handleRemoveSingleGroup = useCallback(
    (groupId: number) => {
      setSelectedIds((prev) => {
        if (!prev.has(groupId)) return prev
        const next = new Set<number>(prev)
        next.delete(groupId)
        return next
      })
      onRemoveGroup(groupId)
    },
    [onRemoveGroup]
  )

  const currentSortLabel = columns.find((c) => c.key === sortState?.key)?.header || 'Сортировка'

  return (
    <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-lg backdrop-blur-sm">
      {/* Top border glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/5 bg-slate-800/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-1.5">
          <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-white">
            Поиск по региону
          </h2>
          <p className="text-sm text-slate-400">
            Поиск групп в регионе{' '}
            <span className="font-mono-accent text-cyan-400">«Еврейская автономная область»</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSearchClick}
            disabled={!canSearch}
            size="sm"
            className="group relative h-10 min-w-[140px] overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative flex items-center justify-center gap-2">
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
              className="h-10 text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-0">
        {error && (
          <div className="animate-in slide-in-from-top-2 fade-in-0 m-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="font-mono-accent">⚠</span> {error}
          </div>
        )}

        {isLoading && !hasResults && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="mr-2" />
            <span className="font-mono-accent text-sm text-slate-400">
              Выполняется поиск групп...
            </span>
          </div>
        )}

        {!isLoading && !hasResults && total > 0 && !error && (
          <div className="p-6 text-center text-sm text-slate-400">
            Все найденные группы уже добавлены в базу данных.
          </div>
        )}

        {!isLoading && !hasResults && total === 0 && !error && (
          <div className="p-6 text-center text-sm text-slate-400">
            В регионе пока не найдено сообществ, отсутствующих в базе.
          </div>
        )}

        {hasResults && (
          <div className="flex flex-col">
            {/* Selection controls */}
            <div className="flex flex-col gap-3 border-b border-white/5 bg-slate-800/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer select-none items-center gap-2.5">
                  <div className="relative">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={isAllSelected}
                      disabled={!hasResults || isLoading}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
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
                  ({results.length})
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
                          onClick={() => requestSort(col.key)}
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
                  onClick={handleAddGroups}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-1.5">
                    {isBulkAdding && <Spinner className="size-3" />}
                    {hasSelection ? `Добавить (${selectionSize})` : 'Добавить все'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedResults.map((group, index) => (
                <div
                  key={group.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <RegionGroupCard
                    group={group}
                    isSelected={selectedIds.has(group.id)}
                    isBulkAdding={isBulkAdding}
                    onToggleSelection={toggleSelection}
                    onAddGroup={handleAddSingleGroup}
                    onRemoveGroup={handleRemoveSingleGroup}
                    formatCityTitle={formatCityTitle}
                    renderMembersCount={renderMembersCount}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RegionGroupsSearchCard
