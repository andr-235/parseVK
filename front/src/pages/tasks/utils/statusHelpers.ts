import type { Task } from '@/shared/types'

export const getTaskStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Ожидание'
    case 'processing':
      return 'В обработке'
    case 'running':
      return 'Выполняется'
    case 'completed':
      return 'Завершена'
    case 'failed':
      return 'Ошибка'
    default:
      return status
  }
}

export const getGroupStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Ожидание'
    case 'processing':
      return 'В обработке'
    case 'running':
      return 'Выполняется'
    case 'success':
      return 'Успешно'
    case 'failed':
      return 'Ошибка'
    default:
      return status
  }
}

export const STATUS_BADGE_BASE =
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide'

export const TASK_STATUS_COLORS: Record<Task['status'], string> = {
  pending: 'bg-accent-warning/20 text-accent-warning ring-1 ring-inset ring-accent-warning/30',
  processing: 'bg-accent-info/20 text-accent-info ring-1 ring-inset ring-accent-info/30',
  running: 'bg-accent-primary/20 text-accent-primary ring-1 ring-inset ring-accent-primary/30',
  completed: 'bg-accent-success/20 text-accent-success ring-1 ring-inset ring-accent-success/30',
  failed: 'bg-accent-danger/20 text-accent-danger ring-1 ring-inset ring-accent-danger/30',
}

export const TASK_STATUS_BADGE: Record<Task['status'], string> = {
  pending: 'bg-accent-warning/10 text-accent-warning',
  processing: 'bg-accent-info/10 text-accent-info',
  running: 'bg-accent-primary/10 text-accent-primary',
  completed: 'bg-accent-success/10 text-accent-success',
  failed: 'bg-accent-danger/10 text-accent-danger',
}

export const GROUP_STATUS_CLASSES: Record<string, string> = {
  pending: 'text-accent-warning',
  processing: 'text-accent-info',
  running: 'text-accent-primary',
  success: 'text-accent-success',
  failed: 'text-accent-danger',
}

const STATUS_WEIGHTS: Record<Task['status'], number> = {
  pending: 0,
  processing: 1,
  running: 2,
  completed: 3,
  failed: 4,
}

export const getStatusWeight = (status: Task['status']): number =>
  STATUS_WEIGHTS[status] ?? Number.POSITIVE_INFINITY
