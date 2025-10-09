import { useMemo } from 'react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import type { Group, TableColumn } from '../../../types'
import LoadingGroupsState from './LoadingGroupsState'
import EmptyGroupsState from './EmptyGroupsState'

type ColumnsFactory = (deleteGroup: (id: number) => void) => TableColumn[]

interface GroupsTableCardProps {
  groups: Group[]
  isLoading: boolean
  onClear: () => void | Promise<void>
  onDelete: (id: number) => void
  columns: ColumnsFactory
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

function GroupsTableCard({ groups, isLoading, onClear, onDelete, columns }: GroupsTableCardProps) {
  const hasGroups = groups.length > 0
  const tableColumns = useMemo(() => columns(onDelete), [columns, onDelete])

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

  const renderContent = () => {
    if (isLoading && !hasGroups) {
      return <LoadingGroupsState />
    }

    if (!hasGroups) {
      return <EmptyGroupsState />
    }

    return (
      <div className="overflow-x-auto rounded-[20px] border border-border bg-background-primary">
        <Table>
          <TableHeader>
            <TableRow>
              {tableColumns.map((column) => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group, index) => (
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
    )
  }

  return (
    <section className="flex flex-col gap-8 rounded-[26px] border border-border bg-background-secondary p-6 shadow-[0_24px_48px_-34px_rgba(0,0,0,0.28)] md:gap-10 md:p-8 dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]" aria-label="Список групп">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <h2 className="text-2xl font-bold text-text-primary">Список групп</h2>
          <p className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex min-w-[220px] flex-col items-end gap-3">
          <div className="flex w-full flex-wrap items-center justify-end gap-3">
            {isLoading ? (
              <Badge variant="secondary" className="bg-[rgba(241,196,15,0.18)] text-[#f1c40f] dark:text-[#f9e79f]">
                Загрузка…
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-[rgba(52,152,219,0.12)] text-[#3498db] dark:text-[#5dade2]">
                {groups.length} {getCounterLabel(groups.length)}
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
      </header>

      {renderContent()}
    </section>
  )
}

export default GroupsTableCard
