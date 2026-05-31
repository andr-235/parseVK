import type { GroupStatus, TaskStatus, TaskStatusComputationContext } from './tasksStore.types'
import type { UnknownRecord } from './records'

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
