import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SearchInput from '@/components/common/SearchInput'
import { Card, CardContent } from '@/components/ui/card'
import { useTableSorting } from '@/hooks/common'
import type { Group, TableColumn } from '@/types'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ArrowUpDown, Trash2 } from 'lucide-react'
import { GroupCard } from './GroupCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { declOfNumber } from '@/utils/common'

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
  const {
    sortedItems: sortedGroups,
    sortState,
    requestSort,
  } = useTableSorting(groups, tableColumns)

  const clearDisabled = isLoading || !hasGroups
  const badgeText = searchTerm.trim() ? `${groups.length} из ${totalCount}` : `${totalCount}`

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
    <Card className="relative overflow-hidden rounded-card border border-border bg-background-secondary shadow-soft-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border bg-background-sidebar/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
            Список групп
          </h2>
          {!isLoading && (
            <Badge className="border border-border bg-background-primary px-3 py-1 font-mono-accent text-xs text-text-secondary">
              {badgeText} {declOfNumber(totalCount, ['группа', 'группы', 'групп'])}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Поиск..."
            className="h-10 w-full border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-primary/50 focus:ring-primary/20 sm:w-[250px]"
          />

          {hasGroups && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 border-border bg-background-primary text-text-secondary hover:border-primary/50 hover:bg-background-sidebar hover:text-text-light"
                >
                  <ArrowUpDown className="size-4" />
                  <span className="max-w-[100px] truncate">{currentSortLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border border-border bg-background-secondary shadow-soft-lg"
              >
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.key}
                    onClick={() => requestSort(option.key)}
                    className="text-text-secondary hover:bg-background-primary hover:text-text-light"
                  >
                    {option.label}
                    {sortState?.key === option.key && (
                      <span className="ml-auto font-mono-accent text-xs text-primary">
                        {sortState.direction === 'asc' ? ' ↑' : ' ↓'}
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
              className="h-10 text-text-secondary transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
              title="Очистить список"
            >
              <Trash2 className="mr-2 size-4" />
              <span className="sr-only sm:not-sr-only">Очистить все</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 md:p-6">
        {isLoading && !hasGroups && (
          <div className="py-8">
            <LoadingState message="Загружаем группы…" />
          </div>
        )}

        {!isLoading && !hasGroups && (
          <EmptyState
            variant="custom"
            icon="📁"
            title="Список пуст"
            description="Добавьте группы по ссылке или загрузите список из файла — после обработки данные появятся здесь и будут доступны для управления."
          />
        )}

        {hasGroups && !isLoading && !hasFilteredGroups && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-sm text-text-secondary">
              По запросу «<span className="font-mono-accent text-primary">{searchTerm}</span>»
              ничего не найдено
            </div>
          </div>
        )}

        {hasFilteredGroups && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedGroups.map((group, index) => (
              <div
                key={group.id}
                className="h-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: index < 12 ? `${index * 50}ms` : '0ms' }}
              >
                <GroupCard group={group} onDelete={onDelete} />
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <span className="font-mono-accent text-sm text-text-secondary">Загрузка...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GroupsTableCard
