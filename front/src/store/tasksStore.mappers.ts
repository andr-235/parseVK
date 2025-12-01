import type { IParsingTaskResult, IParsingTaskSummary } from '@/types/api'
import type { GroupStatus, Task, TaskDetails } from './tasksStore.types'
import {
  cleanStats,
  collectGroupIds,
  createEmptyGroupStatusCounters,
  deriveGroupStatus,
  deriveTaskStatus,
  extractGroups,
  findGroupMetadata,
  firstDefined,
  getNumericFromRecord,
  hasObjectEntries,
  mergeStats,
  normalizeGroupStatusValue,
  normalizeId,
  normalizeTaskStatusValue,
  parseJsonObject,
  toNumber
} from './tasksStore.utils'
import type { UnknownRecord } from './tasksStore.utils'

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

  const statsFromSummary = mergeStats(summary.stats, description?.stats, description)

  const totalItemsFromSummary = firstDefined(
    toNumber(summary.totalItems),
    toNumber((summary as UnknownRecord).totalItems),
    toNumber((summary as UnknownRecord).total),
    toNumber((summary as UnknownRecord).totalCount),
    toNumber((summary as UnknownRecord).targetCount)
  )

  const processedItemsFromSummary = firstDefined(
    toNumber(summary.processedItems),
    toNumber((summary as UnknownRecord).processedItems),
    toNumber((summary as UnknownRecord).processedCount),
    toNumber((summary as UnknownRecord).handledCount),
    toNumber(statsFromSummary.processed)
  )

  const progressFromSummary = firstDefined(
    toNumber(summary.progress),
    toNumber((summary as UnknownRecord).progress)
  )

  const processedFromProgress =
    progressFromSummary != null && totalItemsFromSummary != null
      ? Math.max(
          Math.min(Math.round(totalItemsFromSummary * progressFromSummary), totalItemsFromSummary),
          0
        )
      : undefined

  const resolvedProcessedItems = firstDefined(
    processedItemsFromSummary,
    processedFromProgress
  )

  const normalizedProcessedItems =
    resolvedProcessedItems != null ? Math.max(Math.min(resolvedProcessedItems, Number.MAX_SAFE_INTEGER), 0) : undefined

  const groupsCountValue = firstDefined(
    toNumber(summary.groupsCount),
    toNumber((summary as UnknownRecord).groupsCount),
    toNumber((summary as UnknownRecord).groupCount),
    totalItemsFromSummary,
    statsFromSummary.groups,
    Array.isArray((summary as UnknownRecord).groupIds)
      ? ((summary as UnknownRecord).groupIds as unknown[]).length
      : undefined,
    Array.isArray(description?.groupIds) ? description.groupIds.length : undefined
  ) ?? 0

  const groupIdsFromSummary = Array.isArray(summary.groupIds) ? summary.groupIds : null
  const groupIdsFromDescription = Array.isArray(description?.groupIds) ? description.groupIds : null
  const groupIdsFromRaw = Array.isArray((summary as UnknownRecord).groupIds)
    ? ((summary as UnknownRecord).groupIds as unknown[])
    : null
  const resolvedGroupIdsRaw = groupIdsFromSummary ?? groupIdsFromDescription ?? groupIdsFromRaw

  const normalizedGroupIds = Array.isArray(resolvedGroupIdsRaw)
    ? resolvedGroupIdsRaw
        .map((value) => {
          if (typeof value === 'number' || typeof value === 'string') {
            return normalizeId(value)
          }
          return null
        })
        .filter((value): value is number | string => value !== null)
    : null

  const groupIdsCount = normalizedGroupIds ? normalizedGroupIds.length : null

  const successCountValue = firstDefined(
    toNumber(summary.successCount),
    toNumber((summary as UnknownRecord).successCount),
    statsFromSummary.success
  )

  const failedCountValue = firstDefined(
    toNumber(summary.failedCount),
    toNumber((summary as UnknownRecord).failedCount),
    statsFromSummary.failed
  )

  const processingCountFromStats = firstDefined(
    toNumber((summary as UnknownRecord).processingCount),
    toNumber((summary as UnknownRecord).inProgress),
    toNumber((summary as UnknownRecord).running),
    toNumber((summary as UnknownRecord).activeGroups),
    statsFromSummary.processing,
    statsFromSummary.running
  )

  const pendingCountFromStats = firstDefined(
    toNumber((summary as UnknownRecord).pendingCount),
    toNumber((summary as UnknownRecord).waiting),
    toNumber((summary as UnknownRecord).queued),
    statsFromSummary.pending
  )

  const rawStatus = firstDefined<unknown>(
    summary.status,
    (summary as UnknownRecord).status,
    (summary as UnknownRecord).taskStatus,
    summary.state
  )

  let fallbackStatus: unknown = rawStatus

  if (description?.error && typeof description.error === 'string' && description.error.trim().length > 0) {
    fallbackStatus = 'failed'
  }

  if (!fallbackStatus && typeof summary.completed === 'boolean') {
    fallbackStatus = summary.completed ? 'completed' : 'pending'
  }

  if (!fallbackStatus && failedCountValue != null && failedCountValue > 0) {
    fallbackStatus = 'failed'
  }

  const normalizedStatusHint = normalizeTaskStatusValue(fallbackStatus)

  const processedGroupsCount = Math.max(
    normalizedProcessedItems ?? 0,
    Math.max((successCountValue ?? 0) + (failedCountValue ?? 0), 0)
  )

  const assumedProcessedGroups = (() => {
    if (processedGroupsCount > 0) {
      return processedGroupsCount
    }

    if (groupsCountValue > 0 && normalizedStatusHint === 'completed') {
      return groupsCountValue
    }

    if (groupsCountValue > 0 && normalizedStatusHint === 'failed' && failedCountValue != null) {
      return Math.min(groupsCountValue, Math.max(failedCountValue, 0))
    }

    return processedGroupsCount
  })()

  const totalGroupsForDerivation = firstDefined(
    groupsCountValue,
    totalItemsFromSummary,
    statsFromSummary.groups,
    groupIdsCount ?? undefined
  )

  const derivedProcessingCount = firstDefined(
    processingCountFromStats,
    totalGroupsForDerivation != null && totalGroupsForDerivation > 0
      ? Math.max(totalGroupsForDerivation - assumedProcessedGroups, 0)
      : undefined
  )

  const derivedPendingCount = firstDefined(
    pendingCountFromStats,
    totalGroupsForDerivation != null && totalGroupsForDerivation > 0
      ? Math.max(
          totalGroupsForDerivation - assumedProcessedGroups - (derivedProcessingCount ?? 0),
          0
        )
      : undefined
  )

  if (!fallbackStatus && groupsCountValue > 0) {
    if (assumedProcessedGroups >= groupsCountValue) {
      fallbackStatus = failedCountValue && failedCountValue > 0 ? 'failed' : 'completed'
    } else if (derivedProcessingCount && derivedProcessingCount > 0) {
      fallbackStatus = 'running'
    }
  }

  const normalizedStatus = normalizeTaskStatusValue(fallbackStatus)
  const preliminaryStatus = deriveTaskStatus(normalizedStatus, {
    groupsCount: groupsCountValue,
    successCount: successCountValue,
    failedCount: failedCountValue,
    processingCount: derivedProcessingCount
  })

  const createdAt = firstDefined<string>(
    summary.createdAt,
    (summary as UnknownRecord).createdAt as string,
    (summary as UnknownRecord).created_at as string
  ) ?? new Date().toISOString()

  const rawTitle = firstDefined<string | null>(
    summary.title,
    (summary as UnknownRecord).name as string,
    description?.title as string
  )

  const scopeValue = firstDefined<string | null>(
    summary.scope as string,
    (summary as UnknownRecord).scope as string,
    description?.scope as string
  )

  const skippedGroupsMessage = firstDefined<string | null>(
    summary.skippedGroupsMessage as string,
    (summary as UnknownRecord).skippedGroupsMessage as string,
    description?.skippedGroupsMessage as string
  )

  const postLimitValue = firstDefined(
    toNumber(summary.postLimit),
    toNumber((summary as UnknownRecord).postLimit),
    toNumber(description?.postLimit)
  )

  const baseTotalGroups =
    firstDefined(
      groupsCountValue,
      totalItemsFromSummary,
      groupIdsCount ?? undefined,
      statsFromSummary.groups
    ) ?? null

  let normalizedFailedCount = failedCountValue ?? statsFromSummary.failed ?? null
  if (normalizedFailedCount != null && normalizedFailedCount < 0) {
    normalizedFailedCount = 0
  }

  let normalizedSuccessCount = successCountValue ?? statsFromSummary.success ?? null
  const shouldAssumeCompleted = normalizedStatus === 'completed' || preliminaryStatus === 'completed'

  if (baseTotalGroups != null && shouldAssumeCompleted) {
    const assumedSuccess = Math.max(0, baseTotalGroups - (normalizedFailedCount ?? 0))
    if (normalizedSuccessCount == null || (normalizedSuccessCount === 0 && assumedSuccess > 0)) {
      normalizedSuccessCount = assumedSuccess
    }
  }

  const successCountForStatus = normalizedSuccessCount ?? successCountValue
  const failedCountForStatus = normalizedFailedCount ?? failedCountValue

  const status = deriveTaskStatus(normalizedStatus, {
    groupsCount: groupsCountValue,
    successCount: successCountForStatus,
    failedCount: failedCountForStatus,
    processingCount: derivedProcessingCount
  })

  const totalForStats = firstDefined(
    statsFromSummary.groups,
    groupsCountValue,
    totalItemsFromSummary,
    groupIdsCount ?? undefined
  )

  const processedForStats = firstDefined(
    statsFromSummary.processed,
    normalizedProcessedItems,
    processedGroupsCount
  )

  const pendingForStats = firstDefined(
    statsFromSummary.pending,
    derivedPendingCount,
    totalForStats != null
      ? Math.max(
          totalForStats - Math.max(processedForStats ?? 0, 0) - Math.max(derivedProcessingCount ?? 0, 0),
          0
        )
      : undefined
  )

  const statsForTask = cleanStats({
    ...statsFromSummary,
    groups: statsFromSummary.groups ?? totalForStats ?? undefined,
    success: statsFromSummary.success ?? normalizedSuccessCount ?? undefined,
    failed: statsFromSummary.failed ?? normalizedFailedCount ?? undefined,
    processing:
      statsFromSummary.processing ?? statsFromSummary.running ?? derivedProcessingCount ?? undefined,
    running: statsFromSummary.running ?? undefined,
    pending: pendingForStats ?? undefined,
    processed: processedForStats ?? undefined
  })

  const task: Task = {
    id: normalizeId(summary.id),
    status,
    createdAt,
    completedAt: firstDefined<string | null>(
      summary.completedAt,
      (summary as UnknownRecord).completedAt as string,
      (summary as UnknownRecord).completed_at as string,
      status === 'completed'
        ? firstDefined<string>(summary.updatedAt, (summary as UnknownRecord).updatedAt as string)
        : undefined
    ) ?? null,
    groupsCount: groupsCountValue || groupIdsCount || statsForTask?.groups || 0,
    successCount: normalizedSuccessCount ?? null,
    failedCount: normalizedFailedCount ?? null,
    title: typeof rawTitle === 'string' ? rawTitle : null,
    scope: scopeValue ?? null,
    skippedGroupsMessage: skippedGroupsMessage ?? null,
    postLimit: postLimitValue ?? null,
    groupIds: normalizedGroupIds ?? null,
    stats: statsForTask
  }

  if (groupIdsCount != null && task.groupsCount === 0) {
    task.groupsCount = groupIdsCount
  }

  logDebug('mapSummaryToTask computed task:', task)

  return task
}

export const mapResultToTaskDetails = (result: IParsingTaskResult): { task: Task; details: TaskDetails } => {
  const description = parseJsonObject(result.description)
  const baseTask = mapSummaryToTask(result)
  logDebug('mapResultToTaskDetails raw result:', result)
  logDebug('mapResultToTaskDetails parsed description:', description)

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

  const groupIdsFromResult = Array.isArray(result.groupIds) ? result.groupIds : null
  const groupIdsFromDescription = Array.isArray(description?.groupIds) ? description.groupIds : null
  const groupIdsFromRaw = Array.isArray((result as UnknownRecord).groupIds)
    ? ((result as UnknownRecord).groupIds as unknown[])
    : null

  const resolvedGroupIdsRaw = groupIdsFromResult ?? groupIdsFromDescription ?? groupIdsFromRaw ?? baseTask.groupIds
  const normalizedGroupIds = Array.isArray(resolvedGroupIdsRaw)
    ? resolvedGroupIdsRaw
        .map((value) => {
          if (typeof value === 'number' || typeof value === 'string') {
            return normalizeId(value)
          }
          return null
        })
        .filter((value): value is number | string => value !== null)
    : baseTask.groupIds ?? null

  const groupIdsCount = Array.isArray(normalizedGroupIds)
    ? normalizedGroupIds.length
    : Array.isArray(baseTask.groupIds)
      ? baseTask.groupIds.length
      : null

  const statsSource = mergeStats(baseTask.stats, result.stats, description?.stats, description)
  const statsSourceRecord = statsSource as UnknownRecord

  const totalItemsFromResult = firstDefined(
    toNumber(result.totalItems),
    toNumber((result as UnknownRecord).totalItems),
    toNumber((result as UnknownRecord).total),
    toNumber((result as UnknownRecord).totalCount),
    toNumber((result as UnknownRecord).targetCount),
    toNumber(statsSourceRecord.totalItems),
    toNumber(statsSourceRecord.total),
    toNumber(statsSourceRecord.totalCount)
  )

  const processedItemsFromResult = firstDefined(
    toNumber(result.processedItems),
    toNumber((result as UnknownRecord).processedItems),
    toNumber((result as UnknownRecord).processedCount),
    toNumber((result as UnknownRecord).handledCount),
    toNumber(statsSource.processed)
  )

  const progressFromResult = firstDefined(
    toNumber(result.progress),
    toNumber((result as UnknownRecord).progress)
  )

  const processedFromProgress =
    progressFromResult != null && totalItemsFromResult != null
      ? Math.max(
          Math.min(Math.round(totalItemsFromResult * progressFromResult), totalItemsFromResult),
          0
        )
      : undefined

  const resolvedProcessedItems = firstDefined(
    processedItemsFromResult,
    processedFromProgress
  )

  const normalizedProcessedItems =
    resolvedProcessedItems != null
      ? Math.max(Math.min(resolvedProcessedItems, Number.MAX_SAFE_INTEGER), 0)
      : undefined

  const rawGroups = extractGroups(
    result.groups,
    (result as UnknownRecord).groupResults,
    (result as UnknownRecord).results,
    description?.groups,
    description?.groupResults,
    description?.results
  )

  const fallbackGroupStatus = normalizeGroupStatusValue(baseTask.status)

  const groups = rawGroups.map((group, index) => {
    if (!group || typeof group !== 'object') {
      const fallbackId = normalizeId(index + 1)
      const metadata = findGroupMetadata(fallbackId)
      return {
        groupId: metadata?.id ?? fallbackId,
        groupName:
          metadata?.name ??
          (typeof group === 'string' && group.trim() !== ''
            ? group
            : `Группа ${index + 1}`),
        status: fallbackGroupStatus,
        error: null,
        parsedData: null,
        progressPercent: null,
        processedCount: null,
        totalCount: null,
        currentIndex: null,
        remainingCount: null
      }
    }

    const data = group as UnknownRecord

    const rawGroupId = firstDefined<number | string>(
      data.groupId as number | string,
      data.group_id as number | string,
      data.id as number | string,
      data.vkGroupId as number | string,
      data.vkId as number | string,
      data.externalId as number | string,
      index + 1
    )

    const rawGroupName = firstDefined<string>(
      data.groupName as string,
      data.title as string,
      data.name as string,
      data.screenName as string,
      data.slug as string
    )

    const statusCandidate = firstDefined<unknown>(
      data.status,
      data.state,
      data.resultStatus,
      data.taskStatus,
      data.processingStatus,
      typeof data.completed === 'boolean'
        ? data.completed
          ? 'success'
          : 'failed'
        : undefined
    )

    const errorCandidate = firstDefined<string | null>(
      data.error as string,
      data.errorMessage as string,
      data.message as string,
      data.reason as string,
      null
    )

    const parsedDataCandidate = parseJsonObject(
      firstDefined<unknown>(data.parsedData, data.result, data.data, null)
    )

    const metadata = findGroupMetadata(rawGroupId ?? index + 1)
    const parsedData = hasObjectEntries(parsedDataCandidate) ? parsedDataCandidate : null
    const errorText = typeof errorCandidate === 'string' && errorCandidate.trim() !== ''
      ? errorCandidate.trim()
      : null
    const normalizedStatus = normalizeGroupStatusValue(statusCandidate ?? baseTask.status)
    const finalStatus = deriveGroupStatus(normalizedStatus, {
      error: errorText,
      parsedData
    })

    const progressPercentValue = firstDefined(
      getNumericFromRecord(data, 'progress', 'progressPercent', 'progress_percent', 'percentage', 'percent'),
      getNumericFromRecord(parsedDataCandidate, 'progress', 'progressPercent', 'progress_percent', 'percentage', 'percent')
    )

    const processedCountValue = firstDefined(
      getNumericFromRecord(
        data,
        'processedPosts',
        'processedCount',
        'processed',
        'completedPosts',
        'parsedPosts',
        'done',
        'completed',
        'parsed'
      ),
      getNumericFromRecord(
        parsedDataCandidate,
        'processedPosts',
        'processedCount',
        'processed',
        'completedPosts',
        'parsedPosts',
        'done',
        'completed',
        'parsed'
      )
    )

    const totalCountValue = firstDefined(
      getNumericFromRecord(
        data,
        'totalPosts',
        'totalCount',
        'total',
        'postsTotal',
        'targetPosts',
        'plannedPosts',
        'expectedPosts',
        'maxPosts'
      ),
      getNumericFromRecord(
        parsedDataCandidate,
        'totalPosts',
        'totalCount',
        'total',
        'postsTotal',
        'targetPosts',
        'plannedPosts',
        'expectedPosts',
        'maxPosts'
      )
    )

    const currentIndexValue = firstDefined(
      getNumericFromRecord(
        data,
        'currentPost',
        'currentPostIndex',
        'current',
        'currentIndex',
        'index',
        'step'
      ),
      getNumericFromRecord(
        parsedDataCandidate,
        'currentPost',
        'currentPostIndex',
        'current',
        'currentIndex',
        'index',
        'step'
      )
    )

    const remainingCountValue = firstDefined(
      getNumericFromRecord(data, 'remainingPosts', 'remaining', 'left', 'pendingPosts'),
      getNumericFromRecord(parsedDataCandidate, 'remainingPosts', 'remaining', 'left', 'pendingPosts')
    )

    return {
      groupId: metadata?.id ?? normalizeId(rawGroupId ?? index + 1),
      groupName:
        metadata?.name ??
        (typeof rawGroupName === 'string' && rawGroupName.trim() !== ''
          ? rawGroupName
          : `Группа ${index + 1}`),
      status: finalStatus,
      error: errorText,
      parsedData,
      progressPercent: progressPercentValue ?? null,
      processedCount: processedCountValue ?? null,
      totalCount: totalCountValue ?? null,
      currentIndex: currentIndexValue ?? null,
      remainingCount: remainingCountValue ?? null
    }
  })

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
      remainingCount: null
    })
    existingIds.add(makeKey(groups[groups.length - 1].groupId))
  })

  const groupStatusCounters = groups.reduce<Record<GroupStatus, number>>((acc, groupItem) => {
    acc[groupItem.status] = (acc[groupItem.status] ?? 0) + 1
    return acc
  }, createEmptyGroupStatusCounters())

  const successFromGroups = groupStatusCounters.success
  const failedFromGroups = groupStatusCounters.failed
  const processingFromGroups = groupStatusCounters.processing + groupStatusCounters.running
  const pendingFromGroups = groupStatusCounters.pending

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

  const normalizedGroupsCountCandidate =
    typeof groupsCountValue === 'number'
      ? groupsCountValue
      : firstDefined(totalItemsFromResult, groupIdsCount ?? undefined, statsSource.groups, baseTask.groupsCount)

  const normalizedGroupsCount = Math.max(normalizedGroupsCountCandidate ?? 0, 0)

  const resolvedSuccessCount = successCountValue ?? baseTask.successCount ?? undefined
  const resolvedFailedCount = failedCountValue ?? baseTask.failedCount ?? undefined
  const processedGroupsCount = Math.max(
    normalizedProcessedItems ?? 0,
    Math.max((resolvedSuccessCount ?? 0) + (resolvedFailedCount ?? 0), 0)
  )

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
          totalForStats - Math.max(processedForStats ?? 0, 0) - Math.max(resolvedProcessingCount ?? 0, 0),
          0
        )
      : undefined
  )

  const statsForTask = cleanStats({
    ...statsSource,
    groups: statsSource.groups ?? totalForStats ?? undefined,
    success: statsSource.success ?? successCountValue ?? undefined,
    failed: statsSource.failed ?? failedCountValue ?? undefined,
    processing: statsSource.processing ?? statsSource.running ?? resolvedProcessingCount ?? undefined,
    running: statsSource.running ?? undefined,
    pending: pendingForStats ?? undefined,
    processed: processedForStats ?? undefined
  }) ?? baseTask.stats

  const derivedTaskStatus = deriveTaskStatus(baseTask.status, {
    groupsCount: normalizedGroupsCount,
    successCount: resolvedSuccessCount,
    failedCount: resolvedFailedCount,
    processingCount: resolvedProcessingCount
  })

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
        : baseTask.title ?? null),
    scope: scopeValue ?? baseTask.scope ?? null,
    skippedGroupsMessage: skippedGroupsMessage ?? baseTask.skippedGroupsMessage ?? null,
    postLimit: postLimitValue ?? baseTask.postLimit ?? null,
    groupIds: normalizedGroupIds ?? baseTask.groupIds ?? null
  }

  if (task.groupsCount === 0 && Array.isArray(task.groupIds) && task.groupIds.length > 0) {
    task.groupsCount = task.groupIds.length
  }

  const details: TaskDetails = {
    ...task,
    groups
  }

  return { task, details }
}
