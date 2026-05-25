import { createEmptyGroupStatusCounters } from '../../tasksStore.utils'
import type { GroupStatus, TaskDetails } from '../../tasksStore.types'

export interface GroupCounters {
  successFromGroups: number
  failedFromGroups: number
  processingFromGroups: number
  pendingFromGroups: number
  groupStatusCounters: Record<GroupStatus, number>
}

/**
 * Подсчитывает количество групп по статусам из массива групп
 */
export const deriveGroupCounters = (groups: TaskDetails['groups']): GroupCounters => {
  const groupStatusCounters = groups.reduce<Record<GroupStatus, number>>((acc, groupItem) => {
    acc[groupItem.status] = (acc[groupItem.status] ?? 0) + 1
    return acc
  }, createEmptyGroupStatusCounters())

  const successFromGroups = groupStatusCounters.success
  const failedFromGroups = groupStatusCounters.failed
  const processingFromGroups = groupStatusCounters.processing + groupStatusCounters.running
  const pendingFromGroups = groupStatusCounters.pending

  return {
    successFromGroups,
    failedFromGroups,
    processingFromGroups,
    pendingFromGroups,
    groupStatusCounters,
  }
}
