import TaskItem from './TaskItem'
import { useTasksList } from '@/modules/tasks/hooks/useTasksList'

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
            className="h-[220px] rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-lg animate-pulse"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          </div>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="relative">
        {/* Subtle Glow */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-slate-800/20 to-slate-700/20 blur-2xl" />

        <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-slate-900/50 backdrop-blur-sm p-10 text-center shadow-lg">
          <div className="mb-2 rounded-full bg-slate-800/50 p-4 border border-white/10">
            <div className="h-8 w-8 rounded-full border-2 border-slate-500/40" />
          </div>
          <p className="text-slate-400 max-w-[300px]">{emptyMessage}</p>
        </div>
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
