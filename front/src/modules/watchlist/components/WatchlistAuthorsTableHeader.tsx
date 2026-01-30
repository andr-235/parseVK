import { memo } from 'react'
import { TableHeader, TableHead, TableRow } from '@/shared/ui/table'
import { TableSortButton } from '@/shared/ui/table-sort-button'
import type { TableColumn, WatchlistAuthorCard } from '@/types'

interface WatchlistAuthorsTableHeaderProps {
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  authorSortState: { key: string; direction: 'asc' | 'desc' } | null
  requestAuthorSort: (key: string) => void
}

export const WatchlistAuthorsTableHeader = memo(
  ({ authorColumns, authorSortState, requestAuthorSort }: WatchlistAuthorsTableHeaderProps) => {
    return (
      <TableHeader>
        <TableRow role="row">
          {authorColumns.map((column) => (
            <TableHead
              key={column.key}
              className={column.headerClassName}
              role="columnheader"
              aria-sort={
                column.sortable && authorSortState?.key === column.key
                  ? authorSortState.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              aria-colindex={authorColumns.findIndex((c) => c.key === column.key) + 1}
            >
              {column.sortable ? (
                <TableSortButton
                  direction={authorSortState?.key === column.key ? authorSortState.direction : null}
                  onClick={() => requestAuthorSort(column.key)}
                  aria-label={`Сортировать по ${column.header}`}
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
    )
  }
)
