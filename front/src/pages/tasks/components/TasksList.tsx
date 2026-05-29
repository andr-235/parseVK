import TasksTableCard from './TasksTableCard'
import { useTasksList } from '@/pages/tasks/hooks/useTasksList'
import { Card, CardContent } from '@/components/ui/card'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TasksListProps {
  onTaskSelect: (taskId: number | string) => void
  emptyMessage: string
  hasGroups?: boolean
}

const TasksList = ({ onTaskSelect, emptyMessage, hasGroups }: TasksListProps) => {
  const { tasks, isLoading } = useTasksList()

  if (isLoading && tasks.length === 0) {
    return (
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm animate-pulse">
        {/* Header skeleton */}
        <div className="border-b bg-muted/30 p-4 md:px-6 h-14 flex items-center">
          <div className="h-5 w-36 bg-muted rounded" />
        </div>
        <CardContent className="p-0">
          <div className="w-full">
            {/* Table Header skeleton */}
            <div className="border-b border-border/60 bg-muted/10 h-10" />
            {/* Table Rows skeletons */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b border-border/40 h-16 flex items-center px-6 gap-4">
                <div className="h-4 w-8 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-5 w-24 bg-muted rounded-full" />
                <div className="h-4 w-28 bg-muted rounded ml-auto" />
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    if (hasGroups === false) {
      return (
        <Card className="relative overflow-hidden rounded-xl border border-border bg-background-secondary/30 py-12 px-6 text-center flex flex-col items-center justify-center min-h-[220px] shadow-sm animate-in fade-in-0 duration-300">
          <div className="mb-4 rounded-full bg-accent-danger/10 p-3.5 border border-accent-danger/20 flex items-center justify-center">
            <Info className="h-6 w-6 text-accent-danger" />
          </div>
          <h4 className="font-monitoring-body text-sm font-semibold text-text-primary mb-1.5">
            Нет активных групп для парсинга
          </h4>
          <p className="text-text-secondary max-w-[360px] text-sm font-normal leading-relaxed font-monitoring-body mb-5">
            Сначала необходимо импортировать или добавить группы в систему на странице «Группы»,
            чтобы настроить сбор данных.
          </p>
          <Button
            variant="outline"
            className="h-10 border-border hover:border-accent-primary/50 text-text-primary hover:text-accent-primary transition-all duration-200"
            onClick={() => (window.location.href = '/groups')}
          >
            Перейти к группам
          </Button>
        </Card>
      )
    }

    return (
      <Card className="relative overflow-hidden rounded-xl border border-border bg-background-secondary/30 py-12 px-6 text-center flex flex-col items-center justify-center min-h-[220px] shadow-sm animate-in fade-in-0 duration-300">
        <div className="mb-4 rounded-full bg-accent-primary/10 p-3.5 border border-accent-primary/20 flex items-center justify-center">
          <Info className="h-6 w-6 text-accent-primary" />
        </div>
        <h4 className="font-monitoring-body text-sm font-semibold text-text-primary mb-1.5">
          История задач пуста
        </h4>
        <p className="text-text-secondary max-w-[320px] text-sm font-normal leading-relaxed font-monitoring-body">
          {emptyMessage}
        </p>
      </Card>
    )
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <TasksTableCard tasks={tasks} emptyMessage={emptyMessage} onTaskSelect={onTaskSelect} />
    </div>
  )
}

export default TasksList
