import { useMemo } from 'react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import SearchInput from '@/shared/components/SearchInput'
import { Card, CardContent } from '@/shared/ui/card'
import { useTableSorting } from '@/shared/hooks'
import type { Group, TableColumn } from '@/types'
import { LoadingState } from '@/shared/components/LoadingState'
import { EmptyState } from '@/shared/components/EmptyState'
import { ArrowUpDown, Trash2 } from 'lucide-react'
import { GroupCard } from './GroupCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

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
    <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-lg backdrop-blur-sm">
      {/* Top border glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/5 bg-slate-800/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-white">
            Список групп
          </h2>
          {!isLoading && (
            <Badge className="border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono-accent text-xs text-cyan-400">
              {badgeText} {getCounterLabel(totalCount)}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Поиск..."
            className="h-10 w-full border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 sm:w-[250px]"
          />

          {hasGroups && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 border-white/10 bg-slate-800/50 text-slate-300 hover:border-cyan-400/50 hover:bg-slate-800 hover:text-white"
                >
                  <ArrowUpDown className="size-4" />
                  <span className="max-w-[100px] truncate">{currentSortLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/10 bg-slate-900/95 backdrop-blur-xl"
              >
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.key}
                    onClick={() => requestSort(option.key)}
                    className="text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    {option.label}
                    {sortState?.key === option.key && (
                      <span className="ml-auto font-mono-accent text-xs text-cyan-400">
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
              className="h-10 text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
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
            <div className="text-sm text-slate-400">
              По запросу «<span className="font-mono-accent text-cyan-400">{searchTerm}</span>»
              ничего не найдено
            </div>
          </div>
        )}

        {hasFilteredGroups && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedGroups.map((group, index) => (
              <div
                key={group.id}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <GroupCard group={group} onDelete={onDelete} />
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <span className="font-mono-accent text-sm text-slate-400">Загрузка...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GroupsTableCard
