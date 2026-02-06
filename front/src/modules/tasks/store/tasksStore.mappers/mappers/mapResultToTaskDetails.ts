import type { IParsingTaskResult } from '@/shared/types'
import type { Task, TaskDetails } from '../../tasksStore.types'
import {
  parseJsonObject,
  normalizeId,
  normalizeGroupStatusValue,
  deriveTaskStatus,
  firstDefined,
  toNumber,
  mergeStats,
  extractGroups,
  collectGroupIds,
  findGroupMetadata,
} from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'
import { extractCounts } from '../extractors/extractCounts'
import { calculateProcessedItems } from '../derivers/deriveTaskFields'
import { deriveGroupCounters } from '../derivers/deriveGroupCounters'
import { buildFinalStats } from '../derivers/deriveTaskFields'
import { mapGroup } from './mapGroup'
import { mapSummaryToTask } from './mapSummaryToTask'

const DEBUG = import.meta.env.DEV

const logDebug = (...args: unknown[]): void => {
  if (DEBUG) {
    console.debug('[TasksStore]', ...args)
  }
}

export const mapResultToTaskDetails = (
  result: IParsingTaskResult
): { task: Task; details: TaskDetails } => {
  const description = parseJsonObject(result.description)
  const baseTask = mapSummaryToTask(result)
  logDebug('mapResultToTaskDetails raw result:', result)
  logDebug('mapResultToTaskDetails parsed description:', description)

  // Извлекаем дополнительные поля
  const scopeValue = firstDefined<string | null>(
    result.scope as string,
    (result as UnknownRecord).scope as string,
    description?.scope as string,
    baseTask.scope ?? null
  )

  const skippedGroupsMessage = firstDefined<string | null>(
    result.skippedGroupsMessage as string,
    (result as UnknownRecord).skippedGroupsMessage as string,
    description?.skippedGroupsMessage as string,
    baseTask.skippedGroupsMessage ?? null
  )

  const postLimitValue = firstDefined(
    toNumber(result.postLimit),
    toNumber((result as UnknownRecord).postLimit),
    toNumber(description?.postLimit),
    baseTask.postLimit ?? undefined
  )

  // Извлекаем groupIds
  const resolvedGroupIdsRaw =
    firstDefined(
      Array.isArray(result.groupIds) ? result.groupIds : null,
      Array.isArray(description?.groupIds) ? description.groupIds : null,
      Array.isArray((result as UnknownRecord).groupIds)
        ? ((result as UnknownRecord).groupIds as unknown[])
        : null
    ) ?? baseTask.groupIds

  const normalizedGroupIds = Array.isArray(resolvedGroupIdsRaw)
    ? resolvedGroupIdsRaw
        .map((value) => {
          if (typeof value === 'number' || typeof value === 'string') {
            return normalizeId(value)
          }
          return null
        })
        .filter((value): value is number | string => value !== null)
    : (baseTask.groupIds ?? null)

  const groupIdsCount = Array.isArray(normalizedGroupIds)
    ? normalizedGroupIds.length
    : Array.isArray(baseTask.groupIds)
      ? baseTask.groupIds.length
      : null

  // Мержим stats
  const statsSource = mergeStats(baseTask.stats, result.stats, description?.stats, description)

  // Извлекаем счетчики из result
  const {
    totalItems: totalItemsFromResult,
    processedItems: processedItemsFromResult,
    progress: progressFromResult,
  } = extractCounts(result, statsSource, groupIdsCount)

  // Вычисляем processedItems
  const { processedItems: normalizedProcessedItems } = calculateProcessedItems(
    processedItemsFromResult ?? undefined,
    progressFromResult ?? undefined,
    totalItemsFromResult ?? undefined
  )

  // Извлекаем и маппим группы
  const rawGroups = extractGroups(
    result.groups,
    (result as UnknownRecord).groupResults,
    (result as UnknownRecord).results,
    description?.groups,
    description?.groupResults,
    description?.results
  )

  const fallbackGroupStatus = normalizeGroupStatusValue(baseTask.status)

  const groups = rawGroups.map((group, index) => mapGroup(group, index, fallbackGroupStatus))

  // Добавляем недостающие группы из groupIds
  const makeKey = (value: number | string): string => String(normalizeId(value))

  const existingIds = new Set(groups.map((item) => makeKey(item.groupId)))
  const allGroupIds = collectGroupIds(
    groups,
    (result as UnknownRecord).groupIds,
    description?.groupIds
  )

  allGroupIds.forEach((groupIdCandidate) => {
    const key = makeKey(groupIdCandidate)
    if (existingIds.has(key)) {
      return
    }

    const metadata = findGroupMetadata(groupIdCandidate)

    groups.push({
      groupId: metadata?.id ?? normalizeId(groupIdCandidate),
      groupName: metadata?.name ?? `Группа ${groups.length + 1}`,
      status: fallbackGroupStatus,
      error: null,
      parsedData: null,
      progressPercent: null,
      processedCount: null,
      totalCount: null,
      currentIndex: null,
      remainingCount: null,
    })
    existingIds.add(makeKey(groups[groups.length - 1].groupId))
  })

  // Вычисляем счетчики из групп
  const { successFromGroups, failedFromGroups, processingFromGroups, pendingFromGroups } =
    deriveGroupCounters(groups)

  // Извлекаем явные счетчики из result
  const groupsCountValue = firstDefined(
    toNumber(result.groupsCount),
    toNumber((result as UnknownRecord).groupsCount),
    toNumber((result as UnknownRecord).groupCount),
    totalItemsFromResult,
    statsSource.groups,
    groupIdsCount ?? undefined,
    groups.length ? groups.length : undefined,
    Array.isArray(description?.groupIds) ? description.groupIds.length : undefined,
    baseTask.groupsCount
  )

  const successCountValue = firstDefined(
    toNumber(result.successCount),
    toNumber((result as UnknownRecord).successCount),
    statsSource.success,
    successFromGroups,
    baseTask.successCount ?? undefined
  )

  const failedCountValue = firstDefined(
    toNumber(result.failedCount),
    toNumber((result as UnknownRecord).failedCount),
    statsSource.failed,
    failedFromGroups,
    baseTask.failedCount ?? undefined
  )

  const processingCountValue = firstDefined(
    toNumber((result as UnknownRecord).processingCount),
    toNumber((result as UnknownRecord).inProgress),
    statsSource.processing,
    statsSource.running,
    processingFromGroups
  )

  const pendingCountValue = firstDefined(
    toNumber((result as UnknownRecord).pendingCount),
    toNumber((result as UnknownRecord).waiting),
    statsSource.pending,
    pendingFromGroups
  )

  // Вычисляем нормализованное количество групп
  const normalizedGroupsCountCandidate =
    typeof groupsCountValue === 'number'
      ? groupsCountValue
      : firstDefined(
          totalItemsFromResult,
          groupIdsCount ?? undefined,
          statsSource.groups,
          baseTask.groupsCount
        )

  const normalizedGroupsCount = Math.max(normalizedGroupsCountCandidate ?? 0, 0)

  const resolvedSuccessCount = successCountValue ?? baseTask.successCount ?? undefined
  const resolvedFailedCount = failedCountValue ?? baseTask.failedCount ?? undefined
  const processedGroupsCount = Math.max(
    normalizedProcessedItems ?? 0,
    Math.max((resolvedSuccessCount ?? 0) + (resolvedFailedCount ?? 0), 0)
  )

  // Вычисляем derivedProcessingCount и derivedPendingCount
  const totalForDerivation = firstDefined(
    typeof groupsCountValue === 'number' ? groupsCountValue : undefined,
    totalItemsFromResult,
    groupIdsCount ?? undefined,
    statsSource.groups,
    baseTask.groupsCount
  )

  const resolvedProcessingCount = firstDefined(
    processingCountValue,
    totalForDerivation != null && totalForDerivation > 0
      ? Math.max(totalForDerivation - processedGroupsCount, 0)
      : undefined
  )

  const resolvedPendingCount = firstDefined(
    pendingCountValue,
    totalForDerivation != null && totalForDerivation > 0
      ? Math.max(totalForDerivation - processedGroupsCount - (resolvedProcessingCount ?? 0), 0)
      : undefined
  )

  // Вычисляем значения для stats
  const totalForStats = firstDefined(
    statsSource.groups,
    typeof groupsCountValue === 'number' ? groupsCountValue : undefined,
    totalItemsFromResult,
    groupIdsCount ?? undefined,
    baseTask.groupsCount
  )

  const processedForStats = firstDefined(
    statsSource.processed,
    normalizedProcessedItems,
    processedGroupsCount
  )

  const pendingForStats = firstDefined(
    statsSource.pending,
    pendingCountValue,
    resolvedPendingCount,
    totalForStats != null
      ? Math.max(
          totalForStats -
            Math.max(processedForStats ?? 0, 0) -
            Math.max(resolvedProcessingCount ?? 0, 0),
          0
        )
      : undefined
  )

  // Собираем финальный stats объект
  const statsForTask =
    buildFinalStats(
      statsSource,
      totalForStats,
      processedForStats,
      pendingForStats,
      successCountValue ?? null,
      failedCountValue ?? null,
      resolvedProcessingCount ?? null
    ) ?? baseTask.stats

  // Деривируем финальный статус задачи
  const derivedTaskStatus = deriveTaskStatus(baseTask.status, {
    groupsCount: normalizedGroupsCount,
    successCount: resolvedSuccessCount,
    failedCount: resolvedFailedCount,
    processingCount: resolvedProcessingCount,
  })

  // Собираем Task объект
  const task: Task = {
    ...baseTask,
    status: derivedTaskStatus,
    groupsCount: totalForStats != null ? Math.max(totalForStats, 0) : normalizedGroupsCount,
    successCount:
      successCountValue != null
        ? successCountValue
        : baseTask.successCount != null
          ? baseTask.successCount
          : null,
    failedCount:
      failedCountValue != null
        ? failedCountValue
        : baseTask.failedCount != null
          ? baseTask.failedCount
          : null,
    stats: statsForTask,
    title:
      baseTask.title ??
      (typeof (result as UnknownRecord).title === 'string'
        ? ((result as UnknownRecord).title as string)
        : (baseTask.title ?? null)),
    scope: scopeValue ?? baseTask.scope ?? null,
    skippedGroupsMessage: skippedGroupsMessage ?? baseTask.skippedGroupsMessage ?? null,
    postLimit: postLimitValue ?? baseTask.postLimit ?? null,
    groupIds: normalizedGroupIds ?? baseTask.groupIds ?? null,
  }

  // Корректировка groupsCount если groupIds есть, но groupsCount = 0
  if (task.groupsCount === 0 && Array.isArray(task.groupIds) && task.groupIds.length > 0) {
    task.groupsCount = task.groupIds.length
  }

  const details: TaskDetails = {
    ...task,
    groups,
  }

  return { task, details }
}
