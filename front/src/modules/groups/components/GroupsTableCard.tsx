import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SearchInput from '@/components/SearchInput'
import { Card, CardContent } from '@/components/ui/card'
import { useTableSorting } from '@/hooks/useTableSorting'
import type { Group, TableColumn } from '@/types'
import LoadingGroupsState from './LoadingGroupsState'
import EmptyGroupsState from './EmptyGroupsState'
import { ArrowUpDown, Trash2 } from 'lucide-react'
import { GroupCard } from './GroupCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ColumnsFactory = (deleteGroup: (id: number) => void) => TableColumn<Group>[]

interface GroupsTableCardProps {
  groups: Group[]
  totalCount: number
  isLoading: boolean
  isLoadingMore: boolean
  onClear: () => void | Promise<void>
  onDelete: (id: number) => void
  columns: ColumnsFactory
  searchTerm: string
  onSearchChange: (value: string) => void
}

const getCounterLabel = (count: number) => {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'группа'
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'группы'
  }

  return 'групп'
}

function GroupsTableCard({
  groups,
  totalCount,
  isLoading,
  isLoadingMore,
  onClear,
  onDelete,
  columns,
  searchTerm,
  onSearchChange,
}: GroupsTableCardProps) {
  const hasGroups = totalCount > 0
  const hasFilteredGroups = groups.length > 0
  const tableColumns = useMemo(() => columns(onDelete), [columns, onDelete])
  const { sortedItems: sortedGroups, sortState, requestSort } = useTableSorting(groups, tableColumns)

  const clearDisabled = isLoading || !hasGroups
  const badgeText = searchTerm.trim()
    ? `${groups.length} из ${totalCount}`
    : `${totalCount}`

  const sortOptions = useMemo(() => {
    return tableColumns
      .filter((col) => col.sortable)
      .map((col) => ({
        key: col.key,
        label: col.header,
      }))
  }, [tableColumns])

  const currentSortLabel = sortOptions.find((o) => o.key === sortState?.key)?.label || 'Сортировка'

  return (
    <Card className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Список групп</h2>
          {!isLoading && (
            <Badge variant="secondary" className="bg-background/50 px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {badgeText} {getCounterLabel(totalCount)}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Поиск..."
            className="h-9 w-full sm:w-[250px]"
          />
          
          {hasGroups && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" size="sm" className="h-9 gap-2">
                      <ArrowUpDown className="size-4" />
                      <span className="truncate max-w-[100px]">{currentSortLabel}</span>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem key={option.key} onClick={() => requestSort(option.key)}>
                      {option.label}
                      {sortState?.key === option.key && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {sortState.direction === 'asc' ? ' (А-Я)' : ' (Я-А)'}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
             </DropdownMenu>
          )}

          {hasGroups && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={clearDisabled}
              className="h-9 text-muted-foreground hover:text-destructive"
              title="Очистить список"
            >
              <Trash2 className="mr-2 size-4" />
              <span className="sr-only sm:not-sr-only">Очистить все</span>
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4 md:p-6">
        {isLoading && !hasGroups && (
            <div className="py-8">
                <LoadingGroupsState />
            </div>
        )}

        {!isLoading && !hasGroups && <EmptyGroupsState />}

        {hasGroups && !isLoading && !hasFilteredGroups && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
             <div className="text-sm text-muted-foreground">
                По запросу «{searchTerm}» ничего не найдено
             </div>
          </div>
        )}

        {hasFilteredGroups && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedGroups.map((group) => (
                 <GroupCard key={group.id} group={group} onDelete={onDelete} />
              ))}
           </div>
        )}
        
        {isLoadingMore && (
           <div className="flex justify-center py-4">
              <span className="text-sm text-muted-foreground">Загрузка...</span>
           </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GroupsTableCard
