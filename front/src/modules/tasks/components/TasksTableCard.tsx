import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSortButton } from '@/components/ui/table-sort-button'
import { useTableSorting } from '@/hooks/useTableSorting'
import type { Task } from '@/types'
import { getTaskTableColumns } from '@/modules/tasks/config/taskTableColumns'

interface TasksTableCardProps {
  tasks: Task[]
  emptyMessage: string
  onTaskSelect: (taskId: number | string) => void
}

function TasksTableCard({ tasks, emptyMessage, onTaskSelect }: TasksTableCardProps) {
  const hasTasks = tasks.length > 0
  const columns = getTaskTableColumns()
  const { sortedItems: sortedTasks, sortState, requestSort } = useTableSorting(tasks, columns)

  return (
    <Card className="rounded-[26px] bg-background-secondary shadow-[0_24px_48px_-34px_rgba(0,0,0,0.28)] dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]" aria-label="Список задач">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-6 space-y-0 p-6 md:p-8">
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <CardTitle className="text-2xl font-bold text-text-primary">История запусков</CardTitle>
          <CardDescription className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
            Сравнивайте статусы, просматривайте детали и повторно запускайте задачи при необходимости.
          </CardDescription>
        </div>
        <div className="flex min-w-[220px] flex-col items-end gap-3">
          <Badge variant="secondary" className="bg-[rgba(52,152,219,0.12)] text-[#3498db] dark:text-[#5dade2]">
            {tasks.length} задач
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-8 md:pb-8">
        {!hasTasks ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[20px] bg-background-primary p-10 text-center text-text-secondary md:p-12">
            {emptyMessage}
          </div>
        ) : (
          <Card className="relative w-full overflow-hidden rounded-[20px] p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key} className={column.headerClassName}>
                        {column.sortable ? (
                          <TableSortButton
                            direction={sortState && sortState.key === column.key ? sortState.direction : null}
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
                  {sortedTasks.map((task: Task, index: number) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer"
                      onClick={() => {
                        onTaskSelect(task.id)
                      }}
                    >
                      {columns.map((column: any) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.render ? column.render(task as Task, index) : String(task[column.key as keyof Task] ?? '')}
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

export default TasksTableCard
