import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useTableSorting } from '@/hooks/common'
import type { Group, TableColumn } from '@/types'
import { Trash2 } from 'lucide-react'
import { GroupCard } from './GroupCard'
import { DataTableCard, type SortOption } from '@/components/common/DataTableCard'

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

  const badgeText = useMemo(() => {
    return searchTerm.trim() ? `${groups.length} из ${totalCount}` : `${totalCount}`
  }, [groups.length, totalCount, searchTerm])

  const sortOptions: SortOption[] = useMemo(() => {
    return tableColumns
      .filter((col) => col.sortable)
      .map((col) => ({
        key: col.key,
        label: col.header,
      }))
  }, [tableColumns])

  const currentSortLabel = sortOptions.find((o) => o.key === sortState?.key)?.label || 'Сортировка'

  const headerActions = useMemo(() => {
    if (!hasGroups) return null
    return (
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
    )
  }, [hasGroups, onClear, clearDisabled])

  return (
    <DataTableCard
      title="Список групп"
      badgeText={badgeText}
      declensionWords={['группа', 'группы', 'групп']}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      sortOptions={sortOptions}
      sortState={sortState}
      onRequestSort={requestSort}
      currentSortLabel={currentSortLabel}
      headerActions={headerActions}
      isLoading={isLoading}
      loadingMessage="Загружаем группы…"
      isEmpty={!isLoading && !hasGroups}
      emptyIcon="📁"
      emptyTitle="Список пуст"
      emptyDescription="Добавьте группы по ссылке или загрузите список из файла — после обработки данные появятся здесь и будут доступны для управления."
      hasFilteredItems={hasFilteredGroups}
    >
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

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <span className="font-mono-accent text-sm text-text-secondary">Загрузка...</span>
        </div>
      )}
    </DataTableCard>
  )
}

export default GroupsTableCard
