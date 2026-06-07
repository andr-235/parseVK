import { Button } from '../../ui'
import type { Column } from './constants'
import { TableShell } from './TableShell'
import { TableHead } from './TableHead'

export type TableErrorProps = {
  columns: Column[]
  message: string
  onRetry: () => void
}

export function TableError({ columns, message, onRetry }: TableErrorProps) {
  return (
    <TableShell>
      <TableHead columns={columns} />
      <tbody>
        <tr>
          <td colSpan={columns.length + 1} className="px-3 py-12 text-center">
            <div className="flex flex-col items-center gap-2 text-sm text-danger">
              <p>{message}</p>
              <Button variant="secondary" size="xs" onClick={onRetry}>
                Повторить
              </Button>
            </div>
          </td>
        </tr>
      </tbody>
    </TableShell>
  )
}
