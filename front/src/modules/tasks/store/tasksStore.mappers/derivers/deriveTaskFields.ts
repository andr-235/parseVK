import { firstDefined, toNumber, cleanStats } from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'
import type { TaskStatus } from '../../tasksStore.types'

export interface ProcessedItemsResult {
  processedItems: number | null
  processedFromProgress: number | undefined
}

export interface DerivedCountsResult {
  derivedProcessingCount: number | null
  derivedPendingCount: number | null
}

export interface NormalizedCountsResult {
  normalizedSuccessCount: number | null
  normalizedFailedCount: number | null
}

export interface StatsFieldsResult {
  totalForStats: number | undefined
  processedForStats: number | undefined
  pendingForStats: number | undefined
}

/**
 * Вычисляет количество обработанных элементов из progress и total
 */
export const calculateProcessedItems = (
  processedRaw: number | undefined,
  progress: number | undefined,
  total: number | undefined
): ProcessedItemsResult => {
  const processedFromProgress =
    progress != null && total != null
      ? Math.max(Math.min(Math.round(total * progress), total), 0)
      : undefined

  const resolvedProcessedItems = firstDefined(processedRaw, processedFromProgress)

  const processedItems =
    resolvedProcessedItems != null
      ? Math.max(Math.min(resolvedProcessedItems, Number.MAX_SAFE_INTEGER), 0)
      : null

  return {
    processedItems,
    processedFromProgress,
  }
}

/**
 * Вычисляет количество обработанных групп на основе processedItems и счетчиков
 */
export const calculateProcessedGroupsCount = (
  processedItems: number | null,
  successCount: number | undefined,
  failedCount: number | undefined
): number => {
  return Math.max(processedItems ?? 0, Math.max((successCount ?? 0) + (failedCount ?? 0), 0))
}

/**
 * Вычисляет assumedProcessedGroups для mapSummaryToTask
 */
export const calculateAssumedProcessedGroups = (
  processedGroupsCount: number,
  groupsCount: number,
  normalizedStatus: TaskStatus,
  failedCount: number | undefined
): number => {
  if (processedGroupsCount > 0) {
    return processedGroupsCount
  }

  if (groupsCount > 0 && normalizedStatus === 'completed') {
    return groupsCount
  }

  if (groupsCount > 0 && normalizedStatus === 'failed' && failedCount != null) {
    return Math.min(groupsCount, Math.max(failedCount, 0))
  }

  return processedGroupsCount
}

/**
 * Вычисляет derivedProcessingCount и derivedPendingCount
 */
export const calculateDerivedCounts = (
  totalGroups: number | undefined,
  processedGroups: number,
  processingCountRaw: number | undefined,
  pendingCountRaw: number | undefined
): DerivedCountsResult => {
  const derivedProcessingCount = firstDefined(
    processingCountRaw,
    totalGroups != null && totalGroups > 0 ? Math.max(totalGroups - processedGroups, 0) : undefined
  )

  const derivedPendingCount = firstDefined(
    pendingCountRaw,
    totalGroups != null && totalGroups > 0
      ? Math.max(totalGroups - processedGroups - (derivedProcessingCount ?? 0), 0)
      : undefined
  )

  return {
    derivedProcessingCount: derivedProcessingCount ?? null,
    derivedPendingCount: derivedPendingCount ?? null,
  }
}

/**
 * Определяет fallback статус для mapSummaryToTask
 */
export const deriveFallbackStatus = (
  rawStatus: unknown,
  description: UnknownRecord | null,
  completedFlag: boolean | null | undefined,
  failedCount: number | undefined,
  processedGroups: number,
  groupsCount: number,
  derivedProcessingCount: number | null
): unknown => {
  let fallbackStatus: unknown = rawStatus

  // Проверка ошибок в description
  if (
    description?.error &&
    typeof description.error === 'string' &&
    description.error.trim().length > 0
  ) {
    fallbackStatus = 'failed'
  }

  // Проверка completed флага
  if (!fallbackStatus && typeof completedFlag === 'boolean') {
    fallbackStatus = completedFlag ? 'completed' : 'pending'
  }

  // Проверка failedCount
  if (!fallbackStatus && failedCount != null && failedCount > 0) {
    fallbackStatus = 'failed'
  }

  // Проверка по processedGroups
  if (!fallbackStatus && groupsCount > 0) {
    if (processedGroups >= groupsCount) {
      fallbackStatus = failedCount && failedCount > 0 ? 'failed' : 'completed'
    } else if (derivedProcessingCount && derivedProcessingCount > 0) {
      fallbackStatus = 'running'
    }
  }

  return fallbackStatus
}

/**
 * Нормализует successCount и failedCount с автоматическим вычислением для completed
 */
export const normalizeSuccessAndFailedCounts = (
  successCountRaw: number | undefined,
  failedCountRaw: number | undefined,
  totalGroups: number | null,
  normalizedStatus: TaskStatus,
  preliminaryStatus: TaskStatus,
  statsSuccess: number | undefined,
  statsFailed: number | undefined
): NormalizedCountsResult => {
  let normalizedFailedCount = failedCountRaw ?? statsFailed ?? null
  if (normalizedFailedCount != null && normalizedFailedCount < 0) {
    normalizedFailedCount = 0
  }

  let normalizedSuccessCount = successCountRaw ?? statsSuccess ?? null
  const shouldAssumeCompleted =
    normalizedStatus === 'completed' || preliminaryStatus === 'completed'

  if (totalGroups != null && shouldAssumeCompleted) {
    const assumedSuccess = Math.max(0, totalGroups - (normalizedFailedCount ?? 0))
    if (normalizedSuccessCount == null || (normalizedSuccessCount === 0 && assumedSuccess > 0)) {
      normalizedSuccessCount = assumedSuccess
    }
  }

  return {
    normalizedSuccessCount,
    normalizedFailedCount,
  }
}

/**
 * Строит значения для stats объекта
 */
export const deriveStatsFields = (
  statsSource: UnknownRecord,
  totalGroups: number | undefined,
  processedItems: number | null,
  processedGroupsCount: number,
  processingCount: number | null,
  pendingCountRaw: number | undefined,
  resolvedPendingCount: number | null
): StatsFieldsResult => {
  const totalForStats = firstDefined(
    toNumber(statsSource.groups),
    totalGroups,
    toNumber(statsSource.totalItems)
  )

  const processedForStats = firstDefined(
    toNumber(statsSource.processed),
    processedItems,
    processedGroupsCount
  )

  const pendingForStats = firstDefined(
    toNumber(statsSource.pending),
    pendingCountRaw,
    resolvedPendingCount,
    totalForStats != null
      ? Math.max(
          totalForStats - Math.max(processedForStats ?? 0, 0) - Math.max(processingCount ?? 0, 0),
          0
        )
      : undefined
  )

  return {
    totalForStats,
    processedForStats,
    pendingForStats,
  }
}

/**
 * Собирает финальный stats объект для задачи
 */
export const buildFinalStats = (
  statsSource: UnknownRecord,
  totalForStats: number | undefined,
  processedForStats: number | undefined,
  pendingForStats: number | undefined,
  successCount: number | null,
  failedCount: number | null,
  processingCount: number | null
) => {
  return cleanStats({
    ...statsSource,
    groups: toNumber(statsSource.groups) ?? totalForStats ?? undefined,
    success: toNumber(statsSource.success) ?? successCount ?? undefined,
    failed: toNumber(statsSource.failed) ?? failedCount ?? undefined,
    processing:
      toNumber(statsSource.processing) ??
      toNumber(statsSource.running) ??
      processingCount ??
      undefined,
    running: toNumber(statsSource.running) ?? undefined,
    pending: pendingForStats ?? undefined,
    processed: processedForStats ?? undefined,
  })
}
