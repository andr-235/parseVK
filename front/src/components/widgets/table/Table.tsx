import type { ReactNode } from 'react'
import { TableSkeleton } from '../../ui/Skeleton'
import { ErrorState } from '../../ui/ErrorState'
import { TableHead } from './TableHead'
import { TableShell } from './TableShell'
import type { Column } from './constants'

export type TableProps = {
  columns: Column[]
  children: ReactNode
  isLoading?: boolean
  isError?: boolean
  error?: unknown
  isEmpty?: boolean
  emptyMessage?: string
  onRetry?: () => void
  header?: ReactNode
  sort?: { key: string; dir: 'asc' | 'desc' }
  onSort?: (key: string) => void
  allChecked?: boolean
  onToggleAll?: () => void
}

export function Table({
  columns,
  children,
  isLoading,
  isError,
  error,
  isEmpty,
  emptyMessage = 'Нет данных',
  onRetry,
  header,
  sort,
  onSort,
  allChecked,
  onToggleAll,
}: TableProps) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-bg-main">
      {header}
      <TableShell>
        <TableHead columns={columns} sort={sort} onSort={onSort} allChecked={allChecked} onToggleAll={onToggleAll} />
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-4">
                <TableSkeleton rows={4} cols={columns.length} />
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center">
                <ErrorState error={error} onRetry={onRetry} />
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </TableShell>
    </div>
  )
}
