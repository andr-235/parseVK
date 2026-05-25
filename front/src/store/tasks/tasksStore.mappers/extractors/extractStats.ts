import { mergeStats, cleanStats } from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'

export interface TaskStats {
  groups?: number
  posts?: number
  comments?: number
  authors?: number
  success?: number
  failed?: number
  processing?: number
  running?: number
  pending?: number
  processed?: number
  [key: string]: unknown
}

export const extractAndMergeStats = (
  source: UnknownRecord,
  description: UnknownRecord | null
): TaskStats => {
  return mergeStats(source.stats, description?.stats, description)
}

export const buildTaskStats = (
  baseStats: TaskStats,
  options: {
    totalGroups?: number
    successCount?: number
    failedCount?: number
    processingCount?: number
    pendingCount?: number
    processedCount?: number
  }
): TaskStats | undefined => {
  return cleanStats({
    ...baseStats,
    groups: baseStats.groups ?? options.totalGroups ?? undefined,
    success: baseStats.success ?? options.successCount ?? undefined,
    failed: baseStats.failed ?? options.failedCount ?? undefined,
    processing: baseStats.processing ?? baseStats.running ?? options.processingCount ?? undefined,
    running: baseStats.running ?? undefined,
    pending: baseStats.pending ?? options.pendingCount ?? undefined,
    processed: baseStats.processed ?? options.processedCount ?? undefined,
  })
}
