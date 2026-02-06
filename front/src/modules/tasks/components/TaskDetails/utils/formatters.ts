import type { TaskDetails as TaskDetailsType } from '@/types'

export const formatDate = (value: string): string => new Date(value).toLocaleString('ru-RU')

export const getNumberFromObject = (
  source: Record<string, unknown>,
  ...keys: string[]
): number | null => {
  for (const key of keys) {
    if (!(key in source)) {
      continue
    }

    const raw = source[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw
    }
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }

  return null
}

// Types
export type TaskStatus = TaskDetailsType['status']
export type GroupStatus = TaskDetailsType['groups'][number]['status']

// Style constants
export const STATUS_BADGE_BASE =
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide'

export const taskStatusClasses: Record<TaskStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-blue-500/10 text-blue-500',
  running: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
}

export const groupStatusClasses: Record<GroupStatus, string> = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  running: 'text-blue-500',
  success: 'text-green-500',
  failed: 'text-red-500',
}
