import { useTableSorting } from '@/hooks/common'
import type { Task } from '@/types'
import { getTaskTableColumns } from '@/config/tasks/taskTableColumns'
import { DataTableCard } from '@/components/common/DataTableCard'
import { DataTable } from '@/components/common/DataTable'

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
    <DataTableCard
      title="История запусков"
      totalCount={tasks.length}
      declensionWords={['задача', 'задачи', 'задач']}
      isEmpty={!hasTasks}
      emptyTitle="Список пуст"
      emptyDescription={emptyMessage}
      contentClassName="p-0!"
    >
      <DataTable
        data={sortedTasks}
        columns={columns}
        sortState={sortState}
        onRequestSort={requestSort}
        onRowClick={(task) => onTaskSelect(task.id)}
      />
    </DataTableCard>
  )
}

export default TasksTableCard
