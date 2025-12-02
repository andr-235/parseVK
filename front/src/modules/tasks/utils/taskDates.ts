import type { Task } from '@/types'

export const getLatestTaskDate = (tasks: Task[]): Date | null => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return null
  }

  const timestamps = tasks
    .flatMap((task) => [task.completedAt, task.createdAt])
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter((value) => Number.isFinite(value))

  if (timestamps.length === 0) {
    return null
  }

  const latest = Math.max(...timestamps)

  return Number.isFinite(latest) ? new Date(latest) : null
}

export const formatTaskDate = (date: Date | null, locale = 'ru-RU'): string => {
  if (!date) {
    return '—'
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[taskDates] Failed to format date', error)
    }

    return date.toLocaleString(locale)
  }
}

