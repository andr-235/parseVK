import { useMemo } from 'react'
import type { TaskDetails as TaskDetailsType } from '@/types'
import { calculateTaskProgress } from '@/modules/tasks/utils/taskProgress'

export const useTaskStats = (task: TaskDetailsType | undefined) => {
  return useMemo(() => {
    if (!task) {
      return null
    }

    const overallProgress = calculateTaskProgress(task)

    // Scope label
    const scopeLabel = (() => {
      if (!task.scope) {
        return null
      }

      const normalizedScope = typeof task.scope === 'string' ? task.scope.toUpperCase() : task.scope

      if (normalizedScope === 'ALL') {
        return 'Все группы'
      }

      if (normalizedScope === 'SELECTED') {
        const selectedCount = Array.isArray(task.groupIds) ? task.groupIds.length : task.groupsCount
        return `Выбранные группы${selectedCount ? ` (${selectedCount})` : ''}`
      }

      return task.scope
    })()

    // Basic counts
    const successCount = overallProgress.success
    const failedCount = overallProgress.failed
    const processingCountStat = overallProgress.processing
    const pendingCountStat = overallProgress.pending

    const postsCount = typeof task.stats?.posts === 'number' ? task.stats.posts : null
    const commentsCountTotal = typeof task.stats?.comments === 'number' ? task.stats.comments : null

    // Group status distribution
    const groupStatusDistribution = task.groups.reduce<
      Record<TaskDetailsType['groups'][number]['status'], number>
    >(
      (acc, groupItem) => {
        acc[groupItem.status] = (acc[groupItem.status] ?? 0) + 1
        return acc
      },
      {
        pending: 0,
        processing: 0,
        running: 0,
        success: 0,
        failed: 0,
      }
    )

    // Total groups calculation
    const fallbackGroupTotal = Math.max(
      typeof task.groupsCount === 'number' ? task.groupsCount : 0,
      task.groups.length,
      overallProgress.processed + overallProgress.processing + overallProgress.pending
    )
    const totalGroups = overallProgress.total > 0 ? overallProgress.total : fallbackGroupTotal

    // Processed groups
    const successTotal = Math.max(Math.min(successCount, totalGroups), 0)
    const failedTotal = Math.max(Math.min(failedCount, totalGroups), 0)
    const processedTotal = Math.min(
      Math.max(overallProgress.processed, successTotal + failedTotal),
      totalGroups
    )

    // Active groups calculation
    const inProgressFromGroups =
      groupStatusDistribution.processing + groupStatusDistribution.running
    const activeGroups =
      inProgressFromGroups > 0
        ? inProgressFromGroups
        : processingCountStat > 0
          ? Math.min(processingCountStat, totalGroups - processedTotal + processingCountStat)
          : 0

    // Pending groups calculation
    const pendingGroupsCalculated =
      pendingCountStat > 0
        ? Math.min(pendingCountStat, totalGroups)
        : Math.max(totalGroups - processedTotal - activeGroups, 0)
    const pendingGroups =
      groupStatusDistribution.pending > 0
        ? groupStatusDistribution.pending
        : pendingGroupsCalculated

    return {
      overallProgress,
      scopeLabel,
      successCount,
      failedCount,
      processingCountStat,
      pendingCountStat,
      postsCount,
      commentsCountTotal,
      groupStatusDistribution,
      totalGroups,
      processedTotal,
      activeGroups,
      pendingGroups,
    }
  }, [task])
}
