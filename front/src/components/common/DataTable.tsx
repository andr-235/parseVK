import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSortButton } from '@/components/ui/table-sort-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { TableColumn, TableSortState } from '@/types'
import { cn } from '@/utils/common'

export interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  isLoading?: boolean
  loadingRowsCount?: number
  sortState?: TableSortState | null
  onRequestSort?: (key: string) => void
  onRowClick?: (item: T, index: number) => void
  rowClassName?: string | ((item: T, index: number) => string)
  rowKey?: (item: T, index: number) => string | number
  emptyMessage?: string | ReactNode
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  loadingRowsCount = 5,
  sortState,
  onRequestSort,
  onRowClick,
  rowClassName,
  rowKey,
  emptyMessage = 'Нет данных для отображения',
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (onRequestSort) {
      onRequestSort(key)
    }
  }

  const defaultRowKey = (item: T, index: number) => {
    if (rowKey) return rowKey(item, index)
    const itemWithId = item as T & { id?: string | number }
    return itemWithId.id !== undefined ? String(itemWithId.id) : String(index)
  }

  const renderCellContent = (item: T, column: TableColumn<T>, index: number) => {
    if (column.render) {
      return column.render(item, index)
    }

    const value = (item as T & Record<string, unknown>)[column.key]
    if (value === null || value === undefined || value === '') {
      return column.emptyValue ?? '—'
    }

    const valueStr = String(value)
    if (column.truncateAt && valueStr.length > column.truncateAt) {
      return `${valueStr.slice(0, column.truncateAt)}...`
    }

    return valueStr
  }

  const hasData = data.length > 0

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/10">
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            {columns.map((column) => {
              const resolveSortDirection = () => {
                if (sortState && sortState.key === column.key) {
                  return sortState.direction
                }
                return null
              }

              return (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.headerClassName ||
                      'h-10 px-4 py-2 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary'
                  )}
                >
                  {column.sortable && onRequestSort ? (
                    <TableSortButton
                      direction={resolveSortDirection()}
                      onClick={() => handleSort(column.key)}
                      className="h-8 hover:bg-muted/40 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary"
                    >
                      {column.header}
                    </TableSortButton>
                  ) : (
                    <span className="px-2 py-1 font-semibold">{column.header}</span>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            !hasData &&
            Array.from({ length: loadingRowsCount }).map((_, rowIndex) => (
              <TableRow
                key={`skeleton-row-${rowIndex}`}
                className="border-b border-border/40 hover:bg-transparent"
              >
                {columns.map((column) => (
                  <TableCell
                    key={`skeleton-cell-${column.key}`}
                    className={cn(
                      column.cellClassName ||
                        'px-4 py-3 align-middle font-monitoring-body text-sm font-normal text-text-primary'
                    )}
                  >
                    <Skeleton className="h-4 w-3/4 max-w-[150px] bg-white/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && !hasData && (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-text-secondary">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {(hasData || (isLoading && hasData)) &&
            data.map((item, index) => {
              const key = defaultRowKey(item, index)
              const rowClass =
                typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName

              return (
                <TableRow
                  key={key}
                  className={cn(
                    'group border-b border-border/40 transition-colors hover:bg-muted/30',
                    onRowClick && 'cursor-pointer',
                    rowClass
                  )}
                  onClick={() => onRowClick && onRowClick(item, index)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.cellClassName ||
                          'px-4 py-3 align-middle font-monitoring-body text-sm font-normal text-text-primary'
                      )}
                    >
                      {renderCellContent(item, column, index)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
    </div>
  )
}
