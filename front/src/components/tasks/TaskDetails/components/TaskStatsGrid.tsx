import type { TaskDetails as TaskDetailsType } from '@/types'
import { getTaskStatusText } from '@/utils/tasks/statusHelpers'
import { formatDate, STATUS_BADGE_BASE, taskStatusClasses } from '../utils/formatters'

interface TaskStatsGridProps {
  task: TaskDetailsType
  scopeLabel: string | null
  modeLabel: string | null
  totalGroups: number
  postsCount: number | null
  commentsCountTotal: number | null
}

export const TaskStatsGrid = ({
  task,
  scopeLabel,
  modeLabel,
  totalGroups,
  postsCount,
  commentsCountTotal,
}: TaskStatsGridProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-accent-primary mb-1">
          Название
        </p>
        <p className="font-monitoring-body text-sm font-normal text-text-primary truncate" title={task.title || undefined}>
          {task.title || 'Без названия'}
        </p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Статус
        </p>
        <span className={`${STATUS_BADGE_BASE} ${taskStatusClasses[task.status]} font-monitoring-body text-xs font-semibold uppercase tracking-wider`}>
          {getTaskStatusText(task.status)}
        </span>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Охват
        </p>
        <p className="font-monitoring-body text-sm font-normal text-text-primary truncate">{scopeLabel}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Создана
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">{formatDate(task.createdAt)}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Режим
        </p>
        <p className="font-monitoring-body text-sm font-normal text-text-primary">{modeLabel ?? 'Последние посты'}</p>
      </div>
      {task.mode !== 'recheck_group' && (
        <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
          <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            Лимит постов
          </p>
          <p className="font-mono-accent text-xs font-medium text-text-primary">{task.postLimit ?? '—'}</p>
        </div>
      )}
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Всего групп
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">{totalGroups}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Постов
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">{postsCount ?? 0}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Комментариев
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">{commentsCountTotal ?? 0}</p>
      </div>
    </div>
  )
}
