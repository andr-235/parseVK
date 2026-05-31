import type { TaskStatsInfo, TaskStatus, TasksStore } from '@/pages/tasks/store'
import { normalizeId, rebuildTaskList, toTaskKey } from '@/pages/tasks/store'

export type GatewayTaskStatus = 'pending' | 'running' | 'done' | 'failed'

export interface TaskSocketPayload {
  id: number | string
  status?: GatewayTaskStatus
  completed?: boolean | null
  totalItems?: number | string | null
  processedItems?: number | string | null
  progress?: number | string | null
  stats?: Partial<Record<keyof TaskStatsInfo, number>> | null
  scope?: string | null
  mode?: string | null
  groupIds?: Array<number | string> | null
  postLimit?: number | string | null
  skippedGroupsMessage?: string | null
  description?: string | null
  error?: string | null
  title?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  completedAt?: string | null
}

const hasOwnProperty = (target: object, key: PropertyKey): boolean => {
  return Object.prototype.hasOwnProperty.call(target, key)
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

export const mapGatewayStatus = (
  status: GatewayTaskStatus | undefined,
  completed: boolean | null | undefined
): TaskStatus => {
  if (status === 'failed') {
    return 'failed'
  }

  if (status === 'done' || completed === true) {
    return 'completed'
  }

  if (status === 'running') {
    return 'running'
  }

  return 'pending'
}

export const mergeSocketStats = (
  current: TaskStatsInfo | undefined,
  payload: TaskSocketPayload
): TaskStatsInfo | undefined => {
  const next: TaskStatsInfo = { ...(current ?? {}) }
  const incomingStats = payload.stats ?? null

  if (incomingStats) {
    ;(Object.keys(incomingStats) as Array<keyof TaskStatsInfo>).forEach((key) => {
      const numeric = toFiniteNumber(incomingStats[key])
      if (numeric != null) {
        next[key] = numeric
      }
    })
  }

  const processed = toFiniteNumber(payload.processedItems)
  if (processed != null) {
    next.processed = Math.max(processed, 0)
  }

  return Object.keys(next).length > 0 ? next : undefined
}

export const applyTaskSocketPayload = (
  state: TasksStore,
  payload: TaskSocketPayload | null | undefined
): void => {
  if (!payload || payload.id == null) {
    return
  }

  const normalizedId = normalizeId(payload.id)
  const key = toTaskKey(normalizedId)
  const existingTask = state.tasksById[key]
  if (!existingTask) {
    return
  }

  const status = mapGatewayStatus(payload.status, payload.completed)
  const stats = mergeSocketStats(existingTask.stats, payload)
  const groupsCount = toFiniteNumber(payload.totalItems) ?? existingTask.groupsCount
  const progress = toFiniteNumber(payload.progress)
  const processedItems = toFiniteNumber(payload.processedItems)

  const updatedTask = {
    ...existingTask,
    status,
    stats: stats ?? existingTask.stats,
    groupsCount,
  }

  if (hasOwnProperty(payload, 'skippedGroupsMessage')) {
    updatedTask.skippedGroupsMessage = payload.skippedGroupsMessage ?? null
  }

  if (hasOwnProperty(payload, 'scope')) {
    updatedTask.scope = payload.scope ?? null
  }

  if (hasOwnProperty(payload, 'mode')) {
    updatedTask.mode = payload.mode ?? null
  }

  if (hasOwnProperty(payload, 'postLimit')) {
    if (payload.postLimit === null) {
      updatedTask.postLimit = null
    } else {
      const limit = toFiniteNumber(payload.postLimit)
      if (limit != null) {
        updatedTask.postLimit = limit
      }
    }
  }

  if (hasOwnProperty(payload, 'title')) {
    updatedTask.title = payload.title ?? null
  }

  if (hasOwnProperty(payload, 'completedAt')) {
    updatedTask.completedAt = payload.completedAt ?? null
  }

  if (progress != null) {
    const computedProcessed = Math.max(Math.round(progress * groupsCount), 0)
    updatedTask.stats = {
      ...(updatedTask.stats ?? {}),
      processed: processedItems ?? computedProcessed,
    }
  } else if (processedItems != null) {
    updatedTask.stats = {
      ...(updatedTask.stats ?? {}),
      processed: processedItems,
    }
  }

  state.tasksById[key] = updatedTask
  state.tasks = rebuildTaskList(state.taskIds, state.tasksById)

  const details = state.taskDetails[key]
  if (details) {
    const nextDetails = {
      ...details,
      status,
      stats: updatedTask.stats,
    }

    if (hasOwnProperty(payload, 'skippedGroupsMessage')) {
      nextDetails.skippedGroupsMessage = updatedTask.skippedGroupsMessage ?? null
    }

    if (hasOwnProperty(payload, 'scope')) {
      nextDetails.scope = updatedTask.scope ?? null
    }

    if (hasOwnProperty(payload, 'mode')) {
      nextDetails.mode = updatedTask.mode ?? null
    }

    if (hasOwnProperty(payload, 'postLimit')) {
      nextDetails.postLimit = updatedTask.postLimit ?? null
    }

    if (hasOwnProperty(payload, 'completedAt')) {
      nextDetails.completedAt = updatedTask.completedAt ?? null
    }

    if (hasOwnProperty(payload, 'title')) {
      nextDetails.title = updatedTask.title ?? null
    }

    if (Array.isArray(payload.groupIds)) {
      nextDetails.groupIds = payload.groupIds.map((value) => normalizeId(value))
    }

    state.taskDetails[key] = nextDetails
  }
}
