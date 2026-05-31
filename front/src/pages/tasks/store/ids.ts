import type { TaskIdentifier } from './tasksStore.types'

export const normalizeId = (value: number | string): number | string => {
  const numeric = Number(value)
  return Number.isNaN(numeric) ? value : numeric
}

export const toTaskKey = (taskId: TaskIdentifier): string => {
  return String(normalizeId(taskId))
}
