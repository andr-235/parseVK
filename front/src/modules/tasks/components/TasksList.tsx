import TaskItem from './TaskItem'
import { useTasksList } from '../hooks/useTasksList'

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
          <div key={i} className="h-[220px] rounded-xl bg-card/50 animate-pulse border border-border/50" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-card/30 p-10 text-center">
        <div className="p-4 rounded-full bg-background/50 mb-2">
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/20" />
        </div>
        <p className="text-muted-foreground max-w-[300px]">
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onSelect={onTaskSelect}
        />
      ))}
    </div>
  )
}

export default TasksList
