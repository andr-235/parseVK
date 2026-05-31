import type { TaskStatsInfo } from './tasksStore.types'
import { toNumber, type UnknownRecord } from './records'

export const mergeStats = (...sources: unknown[]): TaskStatsInfo => {
  const stats: TaskStatsInfo = {}
  const aliasMap: Record<keyof TaskStatsInfo, string[]> = {
    groups: ['groups', 'totalGroups', 'groupCount', 'groupsCount', 'count'],
    success: ['success', 'successCount', 'completed', 'completedGroups', 'successGroups'],
    failed: ['failed', 'failedCount', 'errors', 'errorCount', 'failedGroups'],
    processing: [
      'processing',
      'processingCount',
      'inProgress',
      'inProgressCount',
      'processingGroups',
      'active',
    ],
    running: ['running', 'runningCount', 'activeGroups', 'activeCount'],
    pending: ['pending', 'pendingCount', 'waiting', 'queued', 'queue', 'remaining'],
    processed: ['processed', 'processedCount', 'finished', 'finishedCount', 'handled'],
    posts: ['posts', 'postsCount', 'postCount'],
    comments: ['comments', 'commentsCount'],
    authors: ['authors', 'authorsCount', 'users', 'userCount'],
  }

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue
    }

    const data = source as UnknownRecord

    ;(Object.keys(aliasMap) as Array<keyof TaskStatsInfo>).forEach((key) => {
      if (stats[key] != null) {
        return
      }

      for (const alias of aliasMap[key]) {
        if (alias in data) {
          const numeric = toNumber(data[alias])
          if (numeric != null) {
            stats[key] = numeric
            break
          }
        }
      }
    })
  }

  return stats
}

export const cleanStats = (stats?: TaskStatsInfo): TaskStatsInfo | undefined => {
  if (!stats) {
    return undefined
  }

  const cleaned: TaskStatsInfo = {}
  ;(
    [
      'groups',
      'success',
      'failed',
      'processing',
      'running',
      'pending',
      'processed',
      'posts',
      'comments',
      'authors',
    ] as const
  ).forEach((key) => {
    const value = stats[key]
    if (value != null && !Number.isNaN(value)) {
      cleaned[key] = value
    }
  })

  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}
