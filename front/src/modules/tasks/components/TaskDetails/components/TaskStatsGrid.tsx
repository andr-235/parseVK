import type { TaskDetails as TaskDetailsType } from '@/types'
import { getTaskStatusText } from '@/modules/tasks/utils/statusHelpers'
import { formatDate, STATUS_BADGE_BASE, taskStatusClasses } from '../utils/formatters'

interface TaskStatsGridProps {
  task: TaskDetailsType
  scopeLabel: string | null
  totalGroups: number
  postsCount: number | null
  commentsCountTotal: number | null
}

export const TaskStatsGrid = ({
  task,
  scopeLabel,
  totalGroups,
  postsCount,
  commentsCountTotal,
}: TaskStatsGridProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent-primary mb-1">
          Название
        </p>
        <p className="text-sm font-medium text-foreground truncate" title={task.title || undefined}>
          {task.title || 'Без названия'}
        </p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Статус
        </p>
        <span className={`${STATUS_BADGE_BASE} ${taskStatusClasses[task.status]}`}>
          {getTaskStatusText(task.status)}
        </span>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Охват
        </p>
        <p className="text-sm font-medium text-foreground truncate">{scopeLabel}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Создана
        </p>
        <p className="text-sm font-medium text-foreground">{formatDate(task.createdAt)}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Лимит постов
        </p>
        <p className="text-sm font-medium text-foreground">{task.postLimit ?? '—'}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Всего групп
        </p>
        <p className="text-sm font-medium text-foreground">{totalGroups}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Постов
        </p>
        <p className="text-sm font-medium text-foreground">{postsCount ?? 0}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Комментариев
        </p>
        <p className="text-sm font-medium text-foreground">{commentsCountTotal ?? 0}</p>
      </div>
    </div>
  )
}
