import { useTableSorting } from '@/hooks/common'
import type { Task } from '@/types'
import { getTaskTableColumns } from '@/config/tasks/taskTableColumns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable } from '@/components/common/DataTable'
import { declOfNumber } from '@/utils/common'

interface TasksTableCardProps {
  tasks: Task[]
  emptyMessage: string
  onTaskSelect: (taskId: number | string) => void
}

function TasksTableCard({ tasks, emptyMessage, onTaskSelect }: TasksTableCardProps) {
  const hasTasks = tasks.length > 0
  const columns = getTaskTableColumns()

  const {
    sortedItems: sortedTasks,
    sortState,
    requestSort,
  } = useTableSorting(tasks, columns, {
    initialKey: 'createdAt',
    initialDirection: 'desc',
  })

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border bg-background-secondary shadow-soft-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-background-sidebar/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
            История запусков
          </h2>
          {hasTasks && (
            <Badge className="border border-border bg-background-primary px-3 py-1 font-mono-accent text-xs text-text-secondary">
              {tasks.length} {declOfNumber(tasks.length, ['задача', 'задачи', 'задач'])}
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-0">
        {hasTasks ? (
          <DataTable
            data={sortedTasks}
            columns={columns}
            sortState={sortState}
            onRequestSort={requestSort}
            onRowClick={(task) => onTaskSelect(task.id)}
          />
        ) : (
          <EmptyState
            icon="📋"
            title="Список пуст"
            description={emptyMessage}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default TasksTableCard
