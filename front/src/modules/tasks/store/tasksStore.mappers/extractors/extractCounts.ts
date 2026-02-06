import { firstDefined, toNumber } from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'

export interface ExtractedCounts {
  totalItems: number | null
  processedItems: number | null
  progress: number | null
  successCount: number | null
  failedCount: number | null
  processingCount: number | null
  pendingCount: number | null
  groupsCount: number
}

export const extractCounts = (
  source: UnknownRecord,
  stats: UnknownRecord,
  groupIdsCount: number | null
): ExtractedCounts => {
  const totalItems = firstDefined(
    toNumber(source.totalItems),
    toNumber(source.total),
    toNumber(source.totalCount),
    toNumber(source.targetCount)
  )

  const processedItemsRaw = firstDefined(
    toNumber(source.processedItems),
    toNumber(source.processedCount),
    toNumber(source.handledCount),
    toNumber(stats.processed)
  )

  const progress = firstDefined(toNumber(source.progress))

  const processedFromProgress =
    progress != null && totalItems != null
      ? Math.max(Math.min(Math.round(totalItems * progress), totalItems), 0)
      : undefined

  const processedItems =
    processedItemsRaw != null
      ? Math.max(Math.min(processedItemsRaw, Number.MAX_SAFE_INTEGER), 0)
      : processedFromProgress != null
        ? Math.max(Math.min(processedFromProgress, Number.MAX_SAFE_INTEGER), 0)
        : null

  const groupsCount =
    firstDefined(
      toNumber(source.groupsCount),
      toNumber(source.groupCount),
      totalItems,
      toNumber(stats.groups),
      groupIdsCount ?? undefined
    ) ?? 0

  const successCount = firstDefined(toNumber(source.successCount), toNumber(stats.success))

  const failedCount = firstDefined(toNumber(source.failedCount), toNumber(stats.failed))

  const processingCount = firstDefined(
    toNumber(source.processingCount),
    toNumber(source.inProgress),
    toNumber(source.running),
    toNumber(source.activeGroups),
    toNumber(stats.processing),
    toNumber(stats.running)
  )

  const pendingCount = firstDefined(
    toNumber(source.pendingCount),
    toNumber(source.waiting),
    toNumber(source.queued),
    toNumber(stats.pending)
  )

  return {
    totalItems: totalItems ?? null,
    processedItems: processedItems ?? null,
    progress: progress ?? null,
    successCount: successCount ?? null,
    failedCount: failedCount ?? null,
    processingCount: processingCount ?? null,
    pendingCount: pendingCount ?? null,
    groupsCount,
  }
}
