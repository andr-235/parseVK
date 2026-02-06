import type { IParsingTaskSummary } from '@/shared/types'
import type { Task } from '../../tasksStore.types'
import {
  parseJsonObject,
  normalizeId,
  normalizeTaskStatusValue,
  deriveTaskStatus,
  firstDefined,
} from '../../tasksStore.utils'
import { extractTaskData } from '../extractors/extractTaskData'
import { extractGroupIds } from '../extractors/extractGroupIds'
import { extractAndMergeStats } from '../extractors/extractStats'
import { extractCounts } from '../extractors/extractCounts'
import {
  calculateProcessedItems,
  calculateProcessedGroupsCount,
  calculateAssumedProcessedGroups,
  calculateDerivedCounts,
  deriveFallbackStatus,
  normalizeSuccessAndFailedCounts,
  deriveStatsFields,
  buildFinalStats,
} from '../derivers/deriveTaskFields'

const DEBUG = import.meta.env.DEV

const logDebug = (...args: unknown[]): void => {
  if (DEBUG) {
    console.debug('[TasksStore]', ...args)
  }
}

export const mapSummaryToTask = (summary: IParsingTaskSummary): Task => {
  const description = parseJsonObject(summary.description)
  logDebug('mapSummaryToTask raw summary:', summary)
  logDebug('mapSummaryToTask parsed description:', description)

  // Извлекаем базовые данные
  const { title, scope, skippedGroupsMessage, postLimit, createdAt, completedAt } = extractTaskData(
    summary,
    description,
    summary.status
  )

  // Извлекаем groupIds
  const { groupIds: normalizedGroupIds, groupIdsCount } = extractGroupIds(summary, description)

  // Извлекаем и мержим stats
  const statsFromSummary = extractAndMergeStats(summary, description)

  // Извлекаем все счетчики
  const {
    totalItems,
    processedItems: processedItemsRaw,
    progress,
    successCount: successCountValue,
    failedCount: failedCountValue,
    processingCount: processingCountFromStats,
    pendingCount: pendingCountFromStats,
    groupsCount: groupsCountValue,
  } = extractCounts(summary, statsFromSummary, groupIdsCount)

  // Вычисляем processedItems
  const { processedItems: normalizedProcessedItems } = calculateProcessedItems(
    processedItemsRaw ?? undefined,
    progress ?? undefined,
    totalItems ?? undefined
  )

  // Вычисляем количество обработанных групп
  const processedGroupsCount = calculateProcessedGroupsCount(
    normalizedProcessedItems,
    successCountValue ?? undefined,
    failedCountValue ?? undefined
  )

  // Определяем fallback статус (предварительный)
  const rawStatus = firstDefined<unknown>(
    summary.status,
    (summary as Record<string, unknown>).status,
    (summary as Record<string, unknown>).taskStatus,
    summary.state
  )

  const normalizedStatusHint = normalizeTaskStatusValue(rawStatus)

  // Вычисляем assumedProcessedGroups
  const assumedProcessedGroups = calculateAssumedProcessedGroups(
    processedGroupsCount,
    groupsCountValue,
    normalizedStatusHint,
    failedCountValue ?? undefined
  )

  // Определяем общее количество групп для деривации
  const totalGroupsForDerivation = firstDefined(
    groupsCountValue,
    totalItems,
    statsFromSummary.groups,
    groupIdsCount ?? undefined
  )

  // Вычисляем derivedProcessingCount и derivedPendingCount
  const { derivedProcessingCount, derivedPendingCount } = calculateDerivedCounts(
    totalGroupsForDerivation,
    assumedProcessedGroups,
    processingCountFromStats ?? undefined,
    pendingCountFromStats ?? undefined
  )

  // Деривируем fallback статус
  const fallbackStatus = deriveFallbackStatus(
    rawStatus,
    description,
    summary.completed,
    failedCountValue ?? undefined,
    assumedProcessedGroups,
    groupsCountValue,
    derivedProcessingCount
  )

  const normalizedStatus = normalizeTaskStatusValue(fallbackStatus)

  // Предварительная деривация статуса
  const preliminaryStatus = deriveTaskStatus(normalizedStatus, {
    groupsCount: groupsCountValue,
    successCount: successCountValue ?? undefined,
    failedCount: failedCountValue ?? undefined,
    processingCount: derivedProcessingCount ?? undefined,
  })

  // Определяем базовое количество групп
  const baseTotalGroups =
    firstDefined(
      groupsCountValue,
      totalItems,
      groupIdsCount ?? undefined,
      statsFromSummary.groups
    ) ?? null

  // Нормализуем счетчики успешных и неудачных
  const { normalizedSuccessCount, normalizedFailedCount } = normalizeSuccessAndFailedCounts(
    successCountValue ?? undefined,
    failedCountValue ?? undefined,
    baseTotalGroups,
    normalizedStatus,
    preliminaryStatus,
    statsFromSummary.success,
    statsFromSummary.failed
  )

  // Финальная деривация статуса
  const status = deriveTaskStatus(normalizedStatus, {
    groupsCount: groupsCountValue,
    successCount: normalizedSuccessCount ?? undefined,
    failedCount: normalizedFailedCount ?? undefined,
    processingCount: derivedProcessingCount ?? undefined,
  })

  // Вычисляем значения для stats
  const { totalForStats, processedForStats, pendingForStats } = deriveStatsFields(
    statsFromSummary,
    firstDefined(statsFromSummary.groups, groupsCountValue, totalItems, groupIdsCount ?? undefined),
    normalizedProcessedItems,
    processedGroupsCount,
    derivedProcessingCount,
    pendingCountFromStats ?? undefined,
    derivedPendingCount
  )

  // Собираем финальный stats объект
  const statsForTask = buildFinalStats(
    statsFromSummary,
    totalForStats,
    processedForStats,
    pendingForStats,
    normalizedSuccessCount,
    normalizedFailedCount,
    derivedProcessingCount
  )

  // Собираем Task объект
  const task: Task = {
    id: normalizeId(summary.id),
    status,
    createdAt,
    completedAt,
    groupsCount: groupsCountValue || groupIdsCount || statsForTask?.groups || 0,
    successCount: normalizedSuccessCount ?? null,
    failedCount: normalizedFailedCount ?? null,
    title,
    scope,
    skippedGroupsMessage,
    postLimit,
    groupIds: normalizedGroupIds,
    stats: statsForTask,
  }

  // Корректировка groupsCount если groupIds есть, но groupsCount = 0
  if (groupIdsCount != null && task.groupsCount === 0) {
    task.groupsCount = groupIdsCount
  }

  logDebug('mapSummaryToTask computed task:', task)

  return task
}
