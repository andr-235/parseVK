import { useMemo } from 'react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import SearchInput from '../../../components/SearchInput'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { TableSortButton } from '../../../components/ui/table-sort-button'
import { useTableSorting } from '../../../hooks/useTableSorting'
import type { Group, TableColumn } from '../../../types'
import LoadingGroupsState from './LoadingGroupsState'
import EmptyGroupsState from './EmptyGroupsState'

type ColumnsFactory = (deleteGroup: (id: number) => void) => TableColumn<Group>[]

interface GroupsTableCardProps {
  groups: Group[]
  totalCount: number
  isLoading: boolean
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

  const subtitle = useMemo(() => {
    if (isLoading && !hasGroups) {
      return 'Мы подготавливаем данные и проверяем их перед отображением.'
    }

    if (hasGroups) {
      return 'Ниже отображаются все добавленные сообщества. Вы можете открыть группу во вкладке VK или удалить её из базы.'
    }

    return 'После добавления групп их карточки появятся в таблице, и вы сможете управлять ими из одного места.'
  }, [hasGroups, isLoading])

  const clearDisabled = isLoading || !hasGroups
  const badgeText = searchTerm.trim()
    ? `${groups.length} из ${totalCount} ${getCounterLabel(totalCount)}`
    : `${totalCount} ${getCounterLabel(totalCount)}`

  return (
    <Card className="rounded-[26px] bg-background-secondary shadow-[0_24px_48px_-34px_rgba(0,0,0,0.28)] dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]" aria-label="Список групп">
      <CardHeader className="flex flex-col gap-6 space-y-0 p-6 pb-4 md:p-8 md:pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-[260px] flex-1 flex-col gap-2">
            <CardTitle className="text-2xl font-bold text-text-primary">Список групп</CardTitle>
            <CardDescription className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">{subtitle}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap justify-end gap-3">
              {isLoading ? (
                <Badge variant="secondary" className="bg-[rgba(241,196,15,0.18)] text-[#f1c40f] dark:text-[#f9e79f]">
                  Загрузка…
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-[rgba(52,152,219,0.12)] text-[#3498db] dark:text-[#5dade2]">
                  {badgeText}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button className="min-w-[160px]" variant="secondary" disabled>
                Фильтры (скоро)
              </Button>
              <Button className="min-w-[180px]" variant="destructive" onClick={onClear} disabled={clearDisabled}>
                Очистить список
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium uppercase tracking-wide text-text-secondary/80">Поиск по сообществам</span>
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Введите название, домен или VK ID"
          />
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-8 md:pb-8">
        {isLoading && !hasGroups && <LoadingGroupsState />}

        {!isLoading && !hasGroups && <EmptyGroupsState />}

        {hasGroups && !isLoading && !hasFilteredGroups && (
          <div className="rounded-[20px] border border-dashed border-border bg-background-primary/40 p-8 text-center text-sm text-text-secondary dark:border-white/10 dark:bg-white/5 dark:text-text-light/70">
            По вашему запросу ничего не найдено. Проверьте правильность VK ID или названия сообщества.
          </div>
        )}

        {hasFilteredGroups && (
          <Card className="relative w-full overflow-hidden rounded-[20px] p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableColumns.map((column) => (
                      <TableHead key={column.key} className={column.headerClassName}>
                        {column.sortable ? (
                          <TableSortButton
                            direction={sortState?.key === column.key ? sortState.direction : null}
                            onClick={() => requestSort(column.key)}
                          >
                            {column.header}
                          </TableSortButton>
                        ) : (
                          column.header
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map((group, index) => (
                    <TableRow key={group.id || index}>
                      {tableColumns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.render ? column.render(group, index) : group[column.key as keyof Group]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default GroupsTableCard
