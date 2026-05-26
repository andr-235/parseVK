import TaskItem from './TaskItem'
import { useTasksList } from '@/hooks/tasks/useTasksList'

interface TasksListProps {
  onTaskSelect: (taskId: number | string) => void
  emptyMessage: string
}

const TasksList = ({ onTaskSelect, emptyMessage }: TasksListProps) => {
  const { tasks, isLoading } = useTasksList()

  if (isLoading && tasks.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-55 rounded-xl border border-border bg-card/40 shadow-sm animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="relative flex min-h-75 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/20 p-10 text-center">
        <div className="mb-2 rounded-md bg-slate-900/40 p-4 border border-border">
          <div className="h-8 w-8 rounded-full border-2 border-border" />
        </div>
        <p className="text-muted-foreground max-w-75">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <TaskItem task={task} onSelect={onTaskSelect} />
        </div>
      ))}
    </div>
  )
}

export default TasksList
