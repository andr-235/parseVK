import type { ReactNode } from 'react'
import type { TaskDetails as TaskDetailsType } from '@/shared/types'
import { formatDateTime } from '@/shared/utils'
import {
  getTaskStatusText,
  STATUS_BADGE_BASE,
  TASK_STATUS_BADGE,
} from '@/pages/tasks/utils/statusHelpers'
import { StatCell } from './StatCell'

const formatDate = (value: string): string => formatDateTime(value)

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
  const cells: Array<{
    label: string
    labelColor?: 'primary'
    content: ReactNode
    show?: boolean
  }> = [
    {
      label: 'Название',
      labelColor: 'primary',
      content: (
        <p
          className="truncate font-monitoring-body text-sm font-normal text-text-primary"
          title={task.title || undefined}
        >
          {task.title || 'Без названия'}
        </p>
      ),
    },
    {
      label: 'Статус',
      content: (
        <span className={`${STATUS_BADGE_BASE} ${TASK_STATUS_BADGE[task.status]}`}>
          {getTaskStatusText(task.status)}
        </span>
      ),
    },
    {
      label: 'Охват',
      content: (
        <p className="truncate font-monitoring-body text-sm font-normal text-text-primary">
          {scopeLabel}
        </p>
      ),
    },
    {
      label: 'Создана',
      content: (
        <p className="font-mono-accent text-xs font-medium text-text-primary">
          {formatDate(task.createdAt)}
        </p>
      ),
    },
    {
      label: 'Режим',
      content: (
        <p className="font-monitoring-body text-sm font-normal text-text-primary">
          {modeLabel ?? 'Последние посты'}
        </p>
      ),
    },
    {
      label: 'Лимит постов',
      show: task.mode !== 'recheck_group',
      content: (
        <p className="font-mono-accent text-xs font-medium text-text-primary">
          {task.postLimit ?? '-'}
        </p>
      ),
    },
    {
      label: 'Всего групп',
      content: (
        <p className="font-mono-accent text-xs font-medium text-text-primary">{totalGroups}</p>
      ),
    },
    {
      label: 'Постов',
      content: (
        <p className="font-mono-accent text-xs font-medium text-text-primary">{postsCount ?? 0}</p>
      ),
    },
    {
      label: 'Комментариев',
      content: (
        <p className="font-mono-accent text-xs font-medium text-text-primary">
          {commentsCountTotal ?? 0}
        </p>
      ),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cells
        .filter((cell) => cell.show !== false)
        .map((cell) => (
          <StatCell key={cell.label} label={cell.label} labelColor={cell.labelColor}>
            {cell.content}
          </StatCell>
        ))}
    </div>
  )
}
