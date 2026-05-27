import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSortButton } from '@/components/ui/table-sort-button'
import { useTableSorting } from '@/hooks/common'
import type { Task } from '@/types'
import { getTaskTableColumns } from '@/config/tasks/taskTableColumns'
import { declOfNumber } from '@/utils/common'

interface TasksTableCardProps {
  tasks: Task[]
  emptyMessage: string
  onTaskSelect: (taskId: number | string) => void
}

function TasksTableCard({ tasks, emptyMessage, onTaskSelect }: TasksTableCardProps) {
  const hasTasks = tasks.length > 0
  const columns = getTaskTableColumns()
  
  const { sortedItems: sortedTasks, sortState, requestSort } = useTableSorting(tasks, columns, {
    initialKey: 'createdAt',
    initialDirection: 'desc',
  })

  return (
    <Card
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      aria-label="История запусков задач"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <CardTitle className="font-monitoring-body text-base font-semibold text-text-primary">
            История запусков
          </CardTitle>
          {hasTasks && (
            <Badge className="border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-cyan-400">
              {tasks.length} {declOfNumber(tasks.length, ['задача', 'задачи', 'задач'])}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        {!hasTasks ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-10 text-center text-text-secondary border-b border-border/50 font-monitoring-body text-sm font-normal">
            {emptyMessage}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={column.headerClassName || 'h-10 px-4 py-2 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary'}
                    >
                      {column.sortable ? (
                        <TableSortButton
                          direction={
                            sortState && sortState.key === column.key ? sortState.direction : null
                          }
                          onClick={() => requestSort(column.key)}
                          className="h-8 hover:bg-muted/40 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary"
                        >
                          {column.header}
                        </TableSortButton>
                      ) : (
                        <span className="px-2 py-1 font-semibold">{column.header}</span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task: Task, index: number) => (
                  <TableRow
                    key={task.id}
                    className="group border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => onTaskSelect(task.id)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={column.cellClassName || 'px-4 py-3 align-middle font-monitoring-body text-sm font-normal text-text-primary'}
                      >
                        {column.render
                          ? column.render(task as Task, index)
                          : String(task[column.key as keyof Task] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TasksTableCard
