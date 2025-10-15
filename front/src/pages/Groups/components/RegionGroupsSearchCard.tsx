import { useMemo } from 'react'
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

interface RegionGroupsSearchCardProps {
  total: number
  results: IRegionGroupSearchItem[]
  isLoading: boolean
  error: string | null
  onSearch: () => Promise<void> | void
  onAddGroup: (group: IRegionGroupSearchItem) => Promise<void> | void
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

  const {
    sortedItems: sortedResults,
    sortState,
    requestSort,
  } = useTableSorting(results, columns, {
    initialKey: 'members_count',
    initialDirection: 'desc',
  })

  const hasResults = sortedResults.length > 0
  const canSearch = !isLoading
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
    }
  }


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
                <TableRow key={group.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.cellClassName}>
                      {column.render ? column.render(group, index) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        void onAddGroup(group)
                      }}
                    >
                      Добавить в БД
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveGroup(group.id)}
                    >
                      Убрать из списка
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </SectionCard>
  )
}

export default RegionGroupsSearchCard
