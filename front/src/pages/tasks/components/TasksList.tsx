import TasksTableCard from './TasksTableCard'
import { useTasksList } from '@/pages/tasks/hooks/useTasksList'
import { Info } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface TasksListProps {
  onTaskSelect: (taskId: number | string) => void
  emptyMessage: string
  hasGroups?: boolean
}

const TasksList = ({ onTaskSelect, emptyMessage, hasGroups }: TasksListProps) => {
  const { tasks, isLoading } = useTasksList()

  if (isLoading && tasks.length === 0) {
    return (
      <section>
        <div className="border-b border-border/50 px-4 md:px-8 py-3">
          <div className="h-5 w-36 bg-background-secondary rounded animate-pulse" />
        </div>
        <div className="px-4 md:px-8">
          <div className="w-full">
            <div className="border-b border-border/40 bg-background-secondary/30 h-10 mt-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b border-border/20 h-14 flex items-center gap-4">
                <div className="h-4 w-8 bg-background-secondary rounded animate-pulse" />
                <div className="h-4 w-48 bg-background-secondary rounded animate-pulse" />
                <div className="h-5 w-24 bg-background-secondary rounded-full animate-pulse" />
                <div className="h-4 w-28 bg-background-secondary rounded animate-pulse ml-auto" />
                <div className="h-4 w-12 bg-background-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (tasks.length === 0) {
    if (hasGroups === false) {
      return (
        <section className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 rounded-full bg-accent-danger/10 p-3.5 border border-accent-danger/20 flex items-center justify-center">
            <Info className="h-6 w-6 text-accent-danger" aria-hidden="true" />
          </div>
          <h4 className="font-monitoring-body text-sm font-semibold text-text-primary mb-1.5">
            Нет активных групп для парсинга
          </h4>
          <p className="text-text-secondary max-w-xs text-sm font-normal leading-relaxed font-monitoring-body mb-5">
            Сначала необходимо импортировать или добавить группы в систему на странице «Группы»,
            чтобы настроить сбор данных.
          </p>
          <Button
            variant="outline"
            className="h-10 border-border hover:border-accent-primary/50 text-text-primary hover:text-accent-primary transition-colors duration-200"
            onClick={() => (window.location.href = '/groups')}
          >
            Перейти к группам
          </Button>
        </section>
      )
    }

    return (
      <section className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 rounded-full bg-accent-primary/10 p-3.5 border border-accent-primary/20 flex items-center justify-center">
          <Info className="h-6 w-6 text-accent-primary" aria-hidden="true" />
        </div>
        <h4 className="font-monitoring-body text-sm font-semibold text-text-primary mb-1.5">
          История задач пуста
        </h4>
        <p className="text-text-secondary max-w-xs text-sm font-normal leading-relaxed font-monitoring-body">
          {emptyMessage}
        </p>
      </section>
    )
  }

  return (
    <TasksTableCard tasks={tasks} emptyMessage={emptyMessage} onTaskSelect={onTaskSelect} />
  )
}

export default TasksList
