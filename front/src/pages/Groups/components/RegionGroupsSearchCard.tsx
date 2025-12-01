import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IRegionGroupSearchItem } from '../../../types/api'
import { Button } from '@/components/ui/button'
import { TableSortButton } from '@/components/ui/table-sort-button'
import { useTableSorting } from '@/hooks/useTableSorting'
import type { TableColumn } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegionGroupRowProps {
  group: IRegionGroupSearchItem
  columns: TableColumn<IRegionGroupSearchItem>[]
  isSelected: boolean
  isBulkAdding: boolean
  rowIndex: number
  onToggleSelection: (groupId: number) => void
  onAddGroup: (group: IRegionGroupSearchItem) => void | Promise<void>
  onRemoveGroup: (groupId: number) => void
}

const RegionGroupRow = memo(function RegionGroupRow({
  group,
  columns,
  isSelected,
  isBulkAdding,
  rowIndex,
  onToggleSelection,
  onAddGroup,
  onRemoveGroup,
}: RegionGroupRowProps) {
  return (
    <TableRow className="group hover:bg-muted/30">
      <TableCell className="w-12 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(group.id)}
          className="size-4 cursor-pointer rounded border-primary text-primary focus:ring-primary"
          aria-label={isSelected ? 'Снять выделение' : 'Выделить группу'}
        />
      </TableCell>
      {columns.map((column) => (
        <TableCell key={column.key} className={column.cellClassName}>
          {column.render ? column.render(group, rowIndex) : '—'}
        </TableCell>
      ))}
      <TableCell className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8"
          onClick={() => {
            void onAddGroup(group)
          }}
          disabled={isBulkAdding}
        >
          Добавить
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemoveGroup(group.id)}
          disabled={isBulkAdding}
        >
          <X className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
})

interface RegionGroupsSearchCardProps {
  total: number
  results: IRegionGroupSearchItem[]
  isLoading: boolean
  error: string | null
  onSearch: () => Promise<void> | void
  onAddGroup: (group: IRegionGroupSearchItem) => Promise<boolean> | boolean
  onAddSelected: (groups: IRegionGroupSearchItem[]) => Promise<{ successCount: number; failedIds: number[] }>
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
  onReset
}: RegionGroupsSearchCardProps) {
  const formatCityTitle = (group: IRegionGroupSearchItem): string => {
    const city = group.city

    if (!city) {
      return '—'
    }

    if (typeof city === 'string') {
      return city
    }

    if (typeof city === 'object' && city !== null) {
      if ('title' in city && typeof city.title === 'string') {
        return city.title
      }

      if ('name' in city && typeof city.name === 'string') {
        return city.name
      }
    }

    return '—'
  }

  const renderMembersCount = (group: IRegionGroupSearchItem) => {
    if (typeof group.members_count === 'number') {
      return group.members_count.toLocaleString('ru-RU')
    }

    return '—'
  }

  const columns = useMemo<TableColumn<IRegionGroupSearchItem>[]>(() => [
    {
      key: 'name',
      header: 'Название',
      sortable: true,
      sortValue: (item) => item.name?.toLowerCase() ?? '',
      render: (group) => (
        <a
          href={`https://vk.com/${group.screen_name ?? `club${group.id}`}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col rounded-md outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="font-medium leading-tight text-foreground">
            {group.name}
          </span>
          <span className="text-xs text-muted-foreground">
            vk.com/{group.screen_name ?? `club${group.id}`}
          </span>
        </a>
      ),
    },
    {
      key: 'members_count',
      header: 'Участники',
      sortable: true,
      sortValue: (item) => item.members_count ?? null,
      render: (group) => renderMembersCount(group),
      headerClassName: 'w-[140px]',
      cellClassName: 'w-[140px]',
    },
    {
      key: 'city',
      header: 'Город',
      sortable: true,
      sortValue: (item) => {
        const city = item.city
        if (!city) {
          return ''
        }
        if (typeof city === 'string') {
          return city.toLowerCase()
        }
        if (typeof city === 'object') {
          if ('title' in city && typeof city.title === 'string') {
            return city.title.toLowerCase()
          }
          if ('name' in city && typeof city.name === 'string') {
            return city.name.toLowerCase()
          }
        }
        return ''
      },
      render: (group) => formatCityTitle(group),
      headerClassName: 'w-[180px]',
      cellClassName: 'w-[180px]',
    },
  ], [])

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
      if (prev.size === 0) {
        return prev
      }

      const next = new Set<number>()
      for (const group of results) {
        if (prev.has(group.id)) {
          next.add(group.id)
        }
      }

      if (next.size === prev.size) {
        return prev
      }

      return next
    })
  }, [results])

  const resultsMap = useMemo(() => {
    const map = new Map<number, IRegionGroupSearchItem>()
    results.forEach((group) => {
      map.set(group.id, group)
    })
    return map
  }, [results])

  const isAllSelected =
    sortedResults.length > 0
    && sortedResults.every((group) => selectedIds.has(group.id))
  const hasSelection = selectedIds.size > 0
  const isSelectionPartial = hasSelection && !isAllSelected
  const selectionSize = selectedIds.size

  const selectedGroups = useMemo(() => {
    if (!hasSelection) {
      return []
    }

    const items: IRegionGroupSearchItem[] = []
    selectedIds.forEach((id) => {
      const group = resultsMap.get(id)
      if (group) {
        items.push(group)
      }
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
    if (!canSearch) {
      return
    }

    await onSearch()
  }

  const handleResetClick = () => {
    if (!isLoading) {
      onReset?.()
      setSelectedIds(new Set<number>())
    }
  }

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (!hasResults) {
      setSelectedIds(new Set<number>())
      return
    }

    if (checked) {
      const next = new Set<number>()
      sortedResults.forEach((group) => {
        next.add(group.id)
      })
      setSelectedIds(next)
    } else {
      setSelectedIds(new Set<number>())
    }
  }, [hasResults, sortedResults])

  const toggleSelection = useCallback((groupId: number) => {
    setSelectedIds((prev) => {
      const next = new Set<number>(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const handleAddGroups = useCallback(async () => {
    const groupsToAdd = hasSelection ? selectedGroups : results

    if (!groupsToAdd.length) {
      return
    }

    setIsBulkAdding(true)
    try {
      const result = await onAddSelected(groupsToAdd)
      const failedIds = result?.failedIds ?? []
      setSelectedIds(() => {
        if (!failedIds.length) {
          return new Set<number>()
        }

        return new Set<number>(failedIds)
      })
    } finally {
      setIsBulkAdding(false)
    }
  }, [hasSelection, onAddSelected, results, selectedGroups])

  const handleAddSingleGroup = useCallback(async (group: IRegionGroupSearchItem) => {
    const success = await onAddGroup(group)
    if (success) {
      setSelectedIds((prev) => {
        if (!prev.has(group.id)) {
          return prev
        }

        const next = new Set<number>(prev)
        next.delete(group.id)
        return next
      })
    }
  }, [onAddGroup])

  const handleRemoveSingleGroup = useCallback((groupId: number) => {
    setSelectedIds((prev) => {
      if (!prev.has(groupId)) {
        return prev
      }

      const next = new Set<number>(prev)
      next.delete(groupId)
      return next
    })
    onRemoveGroup(groupId)
  }, [onRemoveGroup])

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
        {error && (
           <div className="p-6 text-sm text-destructive">{error}</div>
        )}

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
          <>
            <div className="flex items-center justify-between border-b bg-muted/10 px-6 py-3">
               <div className="text-xs text-muted-foreground">
                 Найдено новых: {results.length} (Всего: {total})
               </div>
               <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={isLoading || isBulkAdding || !hasResults}
                  onClick={handleAddGroups}
               >
                 {isBulkAdding && <Spinner className="mr-2 size-3" />}
                 {hasSelection ? `Добавить выделенное (${selectionSize})` : 'Добавить все'}
               </Button>
            </div>
            
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={!hasResults || isLoading}
                        onChange={(event) => toggleSelectAll(event.target.checked)}
                        className="size-4 cursor-pointer rounded border-primary text-primary focus:ring-primary"
                        aria-label={isAllSelected ? 'Снять выделение со всех' : 'Выделить все группы'}
                      />
                    </TableHead>
                    {columns.map((column) => (
                      <TableHead key={column.key} className={column.headerClassName}>
                        {column.sortable === false ? (
                          column.header
                        ) : (
                          <TableSortButton
                            direction={sortState?.key === column.key ? sortState.direction : null}
                            onClick={() => requestSort(column.key)}
                          >
                            {column.header}
                          </TableSortButton>
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((group, index) => (
                    <RegionGroupRow
                      key={group.id}
                      group={group}
                      columns={columns}
                      isSelected={selectedIds.has(group.id)}
                      isBulkAdding={isBulkAdding}
                      rowIndex={index}
                      onToggleSelection={toggleSelection}
                      onAddGroup={handleAddSingleGroup}
                      onRemoveGroup={handleRemoveSingleGroup}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default RegionGroupsSearchCard
