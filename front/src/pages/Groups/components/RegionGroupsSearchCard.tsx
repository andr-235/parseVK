import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IRegionGroupSearchItem } from '../../../types/api'
import SectionCard from '../../../components/SectionCard'
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
    <TableRow>
      <TableCell className="w-12 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(group.id)}
          className="size-4 cursor-pointer"
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
          onClick={() => {
            void onAddGroup(group)
          }}
          disabled={isBulkAdding}
        >
          Добавить в БД
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemoveGroup(group.id)}
          disabled={isBulkAdding}
        >
          Убрать из списка
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
          <span className="font-medium leading-tight">
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
  const description = useMemo(
    () =>
      'Поиск групп в регионе «Еврейская автономная область». '
        + 'Результаты показывают только сообщества, которых нет в базе данных.',
    []
  )

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
    <SectionCard
      title="Поиск групп по региону"
      description={description}
      headerClassName="border-none pb-4"
      contentClassName="pt-0"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={handleSearchClick} disabled={!canSearch} className="sm:w-auto">
          {isLoading && <Spinner className="mr-2" />}
          Загрузить группы региона
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading || isBulkAdding || !hasResults}
          onClick={handleAddGroups}
          className="sm:w-auto"
        >
          {isBulkAdding && <Spinner className="mr-2" />}
          {hasSelection ? `Добавить выделенное (${selectionSize})` : 'Добавить все'}
        </Button>
        {(total > 0 || hasResults) && (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleResetClick}
            className="sm:w-auto"
          >
            Очистить результаты
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p>
          Найдено групп: {total}
        </p>
        <p>
          Отображаются только группы, которых нет в базе: {results.length}
        </p>
      </div>

      <div className="mt-4">
        {isLoading && !hasResults ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            <span>Выполняется поиск групп…</span>
          </div>
        ) : null}

        {!isLoading && !hasResults && total > 0 && !error ? (
          <p className="text-sm text-muted-foreground">
            Все найденные группы уже добавлены в базу данных.
          </p>
        ) : null}

        {!isLoading && !hasResults && total === 0 && !error ? (
          <p className="text-sm text-muted-foreground">
            В регионе пока не найдено сообществ, отсутствующих в базе.
          </p>
        ) : null}

        {hasResults && (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={isAllSelected}
                    disabled={!hasResults || isLoading}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    className="size-4 cursor-pointer"
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
        )}
      </div>
    </SectionCard>
  )
}

export default RegionGroupsSearchCard
