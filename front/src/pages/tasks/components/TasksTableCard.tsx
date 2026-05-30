import { useTableSorting } from '@/shared/hooks'
import type { Task } from '@/shared/types'
import { getTaskTableColumns } from '@/pages/tasks/config/taskTableColumns'
import { Badge } from '@/shared/components/ui/badge'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { DataTable } from '@/shared/components/common/DataTable'
import { declOfNumber } from '@/shared/utils'
import { FileText } from 'lucide-react'

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
    <section>
      <div className="flex items-center gap-3 border-b border-border/50 px-4 md:px-8 py-3">
        <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
          История запусков
        </h2>
        {hasTasks && (
          <Badge
            variant="outline"
            className="border-border/60 bg-background-secondary px-2.5 py-0.5 font-mono-accent text-xs text-text-secondary"
          >
            {tasks.length} {declOfNumber(tasks.length, ['задача', 'задачи', 'задач'])}
          </Badge>
        )}
      </div>
      <div className="px-4 md:px-8">
        {hasTasks ? (
          <DataTable
            data={sortedTasks}
            columns={columns}
            sortState={sortState}
            onRequestSort={requestSort}
            onRowClick={(task) => onTaskSelect(task.id)}
          />
        ) : (
          <div className="py-12">
            <EmptyState
              icon={<FileText className="w-8 h-8" aria-hidden="true" />}
              title="Список пуст"
              description={emptyMessage}
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default TasksTableCard
