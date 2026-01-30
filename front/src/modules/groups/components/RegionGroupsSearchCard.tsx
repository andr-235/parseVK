import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IRegionGroupSearchItem } from '@/types/api'
import { Button } from '@/shared/ui/button'
import { useTableSorting } from '@/shared/hooks'
import type { TableColumn } from '@/types'
import { Spinner } from '@/shared/ui/spinner'
import { Card, CardContent } from '@/shared/ui/card'
import { Search, X, RotateCcw, ArrowUpDown, Plus } from 'lucide-react'
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
    <div
      className={`relative flex flex-col gap-3 rounded-lg border p-4 transition-colors ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-card hover:bg-muted/30'}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(group.id)}
          className="mt-1 size-4 shrink-0 cursor-pointer rounded border-primary text-primary focus:ring-primary"
        />

        <div className="min-w-0 flex-1 space-y-1">
          <a
            href={`https://vk.com/${group.screen_name ?? `club${group.id}`}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-medium leading-tight text-foreground hover:text-primary hover:underline truncate"
            title={group.name}
          >
            {group.name}
          </a>
          <div className="text-xs text-muted-foreground truncate">
            vk.com/{group.screen_name ?? `club${group.id}`}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground hover:text-destructive"
          onClick={() => onRemoveGroup(group.id)}
          disabled={isBulkAdding}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5" title="Участники">
          <span className="text-xs font-medium">👥 {renderMembersCount(group)}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate max-w-[50%]" title="Город">
          <span className="text-xs truncate">📍 {formatCityTitle(group)}</span>
        </div>
      </div>

      <Button
        size="sm"
        variant="secondary"
        className="w-full h-8 text-xs"
        onClick={() => {
          void onAddGroup(group)
        }}
        disabled={isBulkAdding}
      >
        <Plus className="mr-1.5 size-3" />
        Добавить
      </Button>
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
    <Card className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Поиск по региону</h2>
          <p className="text-sm text-muted-foreground">
            Поиск групп в регионе «Еврейская автономная область»
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSearchClick}
            disabled={!canSearch}
            size="sm"
            className="min-w-[140px]"
          >
            {isLoading ? <Spinner className="mr-2 size-4" /> : <Search className="mr-2 size-4" />}
            Найти группы
          </Button>

          {(total > 0 || hasResults) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isLoading}
              onClick={handleResetClick}
              title="Очистить результаты"
            >
              <RotateCcw className="size-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        {error && <div className="p-6 text-sm text-destructive">{error}</div>}

        {isLoading && !hasResults && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Spinner className="mr-2" />
            Выполняется поиск групп...
          </div>
        )}

        {!isLoading && !hasResults && total > 0 && !error && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Все найденные группы уже добавлены в базу данных.
          </div>
        )}

        {!isLoading && !hasResults && total === 0 && !error && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            В регионе пока не найдено сообществ, отсутствующих в базе.
          </div>
        )}

        {hasResults && (
          <div className="flex flex-col">
            <div className="flex flex-col gap-3 border-b bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={isAllSelected}
                    disabled={!hasResults || isLoading}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    className="size-4 rounded border-primary text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Выбрать все</span>
                </label>
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  ({results.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                      <ArrowUpDown className="size-3.5" />
                      <span className="truncate max-w-[100px] text-xs">{currentSortLabel}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {columns
                      .filter((c) => c.sortable)
                      .map((col) => (
                        <DropdownMenuItem key={col.key} onClick={() => requestSort(col.key)}>
                          {col.header}
                          {sortState?.key === col.key && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {sortState.direction === 'asc' ? ' (А-Я)' : ' (Я-А)'}
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={isLoading || isBulkAdding || !hasResults}
                  onClick={handleAddGroups}
                >
                  {isBulkAdding && <Spinner className="mr-2 size-3" />}
                  {hasSelection ? `Добавить (${selectionSize})` : 'Добавить все'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {sortedResults.map((group) => (
                <RegionGroupCard
                  key={group.id}
                  group={group}
                  isSelected={selectedIds.has(group.id)}
                  isBulkAdding={isBulkAdding}
                  onToggleSelection={toggleSelection}
                  onAddGroup={handleAddSingleGroup}
                  onRemoveGroup={handleRemoveSingleGroup}
                  formatCityTitle={formatCityTitle}
                  renderMembersCount={renderMembersCount}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RegionGroupsSearchCard
