import { useGroupsStore } from '@/modules/groups/store'
import type {
  GroupMetadata,
  GroupStatus,
  Task,
  TaskDetails,
  TaskIdentifier,
  TaskStatsInfo,
  TaskStatus,
  TaskStatusComputationContext,
  TasksStore,
} from './tasksStore.types'

export type UnknownRecord = Record<string, unknown>

export const normalizeId = (value: number | string): number | string => {
  const numeric = Number(value)
  return Number.isNaN(numeric) ? value : numeric
}

export const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return undefined
}

export const firstDefined = <T>(...values: Array<T | undefined | null>): T | undefined => {
  return values.find((value) => value !== undefined && value !== null)
}

export const parseJsonObject = (input: unknown): UnknownRecord | null => {
  if (!input) {
    return null
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return typeof parsed === 'object' && parsed !== null ? (parsed as UnknownRecord) : null
    } catch {
      return null
    }
  }

  if (typeof input === 'object') {
    return input as UnknownRecord
  }

  return null
}

export const ensureGroupsLoaded = async (): Promise<void> => {
  const state = useGroupsStore.getState()
  if (state.groups.length === 0 && typeof state.fetchGroups === 'function') {
    try {
      await state.fetchGroups()
    } catch {
      // игнорируем ошибки загрузки в сторе задач
    }
  }
}

export const findGroupMetadata = (groupId: number | string): GroupMetadata | null => {
  const state = useGroupsStore.getState()
  if (!state || !Array.isArray(state.groups)) {
    return null
  }

  const numeric = toNumber(groupId)
  const match = state.groups.find((group) => {
    if (numeric != null) {
      if (group.id === numeric) {
        return true
      }
      if (typeof group.vkId === 'number' && group.vkId === numeric) {
        return true
      }
    }
    return String(group.id) === String(groupId)
  })

  if (!match) {
    return null
  }

  const hasName = typeof match.name === 'string' && match.name.trim() !== ''
  const hasScreenName = typeof match.screenName === 'string' && match.screenName.trim() !== ''

  let displayName: string
  if (hasName) {
    displayName = match.name
  } else if (hasScreenName && typeof match.screenName === 'string') {
    displayName = match.screenName
  } else {
    displayName = 'Группа ' + String(groupId)
  }

  const normalizedId = match.id != null ? normalizeId(match.id) : normalizeId(groupId)

  return {
    id: normalizedId,
    name: displayName,
  }
}

export const collectGroupIds = (...sources: unknown[]): Array<number | string> => {
  const result: Array<number | string> = []
  const seen = new Set<string>()

  const register = (value: unknown): void => {
    if (typeof value === 'number' || typeof value === 'string') {
      const key = String(value)
      if (!seen.has(key)) {
        seen.add(key)
        result.push(value)
      }
    }
  }

  for (const source of sources) {
    if (!source) {
      continue
    }

    if (Array.isArray(source)) {
      source.forEach((item) => {
        if (typeof item === 'number' || typeof item === 'string') {
          register(item)
        } else if (item && typeof item === 'object') {
          const data = item as UnknownRecord
          const candidate = firstDefined<number | string>(
            data.groupId as number | string,
            data.group_id as number | string,
            data.id as number | string,
            data.vkGroupId as number | string,
            data.vkId as number | string
          )
          if (candidate != null) {
            register(candidate)
          }
        }
      })
    }
  }

  return result
}

export const getNumericFromRecord = (
  source: UnknownRecord | null | undefined,
  ...keys: string[]
): number | undefined => {
  if (!source) {
    return undefined
  }

  for (const key of keys) {
    if (!(key in source)) {
      continue
    }

    const numeric = toNumber((source as UnknownRecord)[key])
    if (numeric != null) {
      return numeric
    }
  }

  return undefined
}

export const hasObjectEntries = (data: UnknownRecord | null): boolean => {
  return !!data && Object.keys(data).length > 0
}

export const createEmptyGroupStatusCounters = (): Record<GroupStatus, number> => ({
  pending: 0,
  processing: 0,
  running: 0,
  success: 0,
  failed: 0,
})

export const deriveTaskStatus = (
  initialStatus: TaskStatus,
  context: TaskStatusComputationContext
): TaskStatus => {
  const groupsCount =
    typeof context.groupsCount === 'number' && Number.isFinite(context.groupsCount)
      ? context.groupsCount
      : 0
  const successCount =
    typeof context.successCount === 'number' && Number.isFinite(context.successCount)
      ? context.successCount
      : 0
  const failedCount =
    typeof context.failedCount === 'number' && Number.isFinite(context.failedCount)
      ? context.failedCount
      : 0
  const processingCount =
    typeof context.processingCount === 'number' && Number.isFinite(context.processingCount)
      ? context.processingCount
      : 0

  const totalGroups = Math.max(groupsCount, 0)
  const processedGroups = Math.max(successCount + failedCount, 0)
  const hasFailures = failedCount > 0
  const allCompleted = totalGroups > 0 && processedGroups >= totalGroups
  const hasRemaining = totalGroups > 0 ? processedGroups < totalGroups : false
  const hasProgress = processedGroups > 0
  const hasProcessingNow = processingCount > 0
  const queuedOnly = hasRemaining && !hasProcessingNow && !hasProgress

  if (allCompleted) {
    return hasFailures ? 'failed' : 'completed'
  }

  if (initialStatus === 'failed') {
    return 'failed'
  }

  if (initialStatus === 'completed' && hasFailures) {
    return 'failed'
  }

  if (initialStatus === 'completed') {
    return 'completed'
  }

  if (hasProcessingNow || hasProgress) {
    return initialStatus === 'processing' ? 'processing' : 'running'
  }

  if (queuedOnly) {
    return initialStatus === 'processing' ? 'processing' : 'pending'
  }

  if ((initialStatus === 'running' || initialStatus === 'processing') && hasRemaining) {
    return initialStatus
  }

  return initialStatus
}

export const deriveGroupStatus = (
  initialStatus: GroupStatus,
  options: { error?: string | null; parsedData?: UnknownRecord | null }
): GroupStatus => {
  const errorText = typeof options.error === 'string' ? options.error.trim() : ''

  if (errorText) {
    return 'failed'
  }

  if (initialStatus === 'success') {
    return 'success'
  }

  // Проверяем наличие финальных результатов парсинга (а не промежуточных данных о прогрессе)
  const parsedData = options.parsedData ?? null
  if (parsedData) {
    const hasFinalResults =
      'postsCount' in parsedData ||
      'commentsCount' in parsedData ||
      'posts' in parsedData ||
      'comments' in parsedData

    if (hasFinalResults) {
      return 'success'
    }
  }

  return initialStatus
}

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

export const normalizeTaskStatusValue = (status: unknown): TaskStatus => {
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'complete':
      case 'done':
        return 'completed'
      case 'failed':
      case 'error':
      case 'errors':
      case 'cancelled':
      case 'canceled':
        return 'failed'
      case 'processing':
      case 'processed':
        return 'processing'
      case 'running':
      case 'in_progress':
      case 'in-progress':
      case 'active':
      case 'progress':
      case 'parsing':
      case 'started':
      case 'working':
      case 'executing':
      case 'scraping':
      case 'collecting':
        return 'running'
      case 'queued':
      case 'pending':
      case 'waiting':
      case 'created':
      case 'new':
      case 'scheduled':
        return 'pending'
      default:
        return 'pending'
    }
  }

  if (status === true) {
    return 'completed'
  }

  return 'pending'
}

export const normalizeGroupStatusValue = (status: unknown): GroupStatus => {
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'complete':
      case 'done':
        return 'success'
      case 'failed':
      case 'error':
      case 'errors':
      case 'cancelled':
      case 'canceled':
        return 'failed'
      case 'processing':
      case 'processed':
        return 'processing'
      case 'running':
      case 'in_progress':
      case 'in-progress':
      case 'active':
      case 'progress':
      case 'parsing':
      case 'started':
      case 'working':
      case 'scraping':
      case 'collecting':
        return 'running'
      case 'queued':
      case 'pending':
      case 'waiting':
      case 'created':
      case 'new':
      case 'scheduled':
        return 'pending'
      default:
        return 'pending'
    }
  }

  if (status === true) {
    return 'success'
  }

  if (status === false) {
    return 'failed'
  }

  return 'pending'
}

export const extractGroups = (...candidates: unknown[]): unknown[] => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }

    if (candidate && typeof candidate === 'object') {
      const data = candidate as UnknownRecord
      const nested = extractGroups(data.groups, data.items, data.data, data.results)
      if (nested.length > 0) {
        return nested
      }
    }
  }

  return []
}

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const toTaskKey = (taskId: TaskIdentifier): string => {
  return String(normalizeId(taskId))
}

export const rebuildTaskList = (ids: TaskIdentifier[], entities: Record<string, Task>): Task[] => {
  if (!Array.isArray(ids)) {
    return []
  }
  return ids.map((id) => entities[toTaskKey(id)]).filter((task): task is Task => Boolean(task))
}

export const replaceTasksCollection = (state: TasksStore, tasks: Task[]): void => {
  state.taskIds = []
  state.tasksById = {}

  tasks.forEach((task) => {
    const key = toTaskKey(task.id)
    if (!state.taskIds.some((existingId) => toTaskKey(existingId) === key)) {
      state.taskIds.push(normalizeId(task.id))
    }
    state.tasksById[key] = task
  })

  state.tasks = rebuildTaskList(state.taskIds, state.tasksById)
}

export const upsertTaskEntity = (
  state: TasksStore,
  task: Task,
  options: { position?: 'start' | 'end' } = {}
): void => {
  const key = toTaskKey(task.id)
  const normalizedId = normalizeId(task.id)
  const existingIndex = state.taskIds.findIndex((id) => toTaskKey(id) === key)

  state.tasksById[key] = task

  if (existingIndex >= 0) {
    state.taskIds[existingIndex] = normalizedId
  } else if (options.position === 'start') {
    state.taskIds.unshift(normalizedId)
  } else {
    state.taskIds.push(normalizedId)
  }

  state.tasks = rebuildTaskList(state.taskIds, state.tasksById)
}

export const ensureTaskDetailsStore = (state: TasksStore): Record<string, TaskDetails> => {
  if (!state.taskDetails || typeof state.taskDetails !== 'object') {
    state.taskDetails = {}
  }
  return state.taskDetails
}
