import type { Task } from '../types'

export interface TaskProgressInfo {
  total: number
  processed: number
  success: number
  failed: number
  processing: number
  pending: number
  hasTotals: boolean
}

const normalizeNumericString = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }

  const withoutNbsp = trimmed.replace(/\u00A0/g, ' ')
  const noSpaces = withoutNbsp.replace(/[\s_]+/g, '')

  if (noSpaces === '') {
    return null
  }

  let normalized = noSpaces

  if (normalized.includes(',') && !normalized.includes('.')) {
    if (/^-?\d{1,3}(,\d{3})+$/.test(normalized)) {
      normalized = normalized.replace(/,/g, '')
    } else {
      normalized = normalized.replace(/,/g, '.')
    }
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(/,/g, '')
  }

  const parsed = Number(normalized)

  return Number.isNaN(parsed) || !Number.isFinite(parsed) ? null : parsed
}

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    return normalizeNumericString(value)
  }

  return null
}

const toPositive = (value: number | null | undefined): number => {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0
  }

  return value < 0 ? 0 : value
}

const pickNumber = (...values: Array<unknown>): number | null => {
  for (const value of values) {
    const numeric = toFiniteNumber(value)
    if (numeric != null) {
      return numeric
    }
  }

  return null
}

export const calculateTaskProgress = (task: Task): TaskProgressInfo => {
  const stats = task.stats ?? {}

  const totalFromTask = toFiniteNumber(task.groupsCount)
  const totalFromStats = toFiniteNumber(stats.groups)
  const totalFromGroupIds = Array.isArray(task.groupIds) ? task.groupIds.length : 0

  let total = toPositive(totalFromTask)
  if (total === 0 && totalFromStats != null) {
    total = toPositive(totalFromStats)
  }
  if (total === 0 && totalFromGroupIds > 0) {
    total = totalFromGroupIds
  }

  const successRaw = pickNumber(stats.success, task.successCount)
  const failedRaw = pickNumber(stats.failed, task.failedCount)
  const processedRaw = pickNumber(stats.processed)
  const processingRaw = pickNumber(stats.processing, stats.running)
  const pendingRaw = pickNumber(stats.pending)

  let success = toPositive(successRaw)
  let failed = toPositive(failedRaw)
  const processedFromStats = toPositive(processedRaw)
  const processing = toPositive(processingRaw)
  let pending = toPositive(pendingRaw)

  if (processedFromStats > 0) {
    if (failed > processedFromStats) {
      failed = processedFromStats
    }

    const derivedSuccess = Math.max(processedFromStats - failed, 0)
    if (success === 0 || derivedSuccess > success) {
      success = derivedSuccess
    }
  }

  let processed = Math.max(success + failed, processedFromStats)

  if (failed > processed) {
    failed = Math.max(Math.min(failed, processed), 0)
  }

  if (success > processed) {
    success = Math.max(Math.min(success, processed - failed), 0)
  }

  if (total > 0 && processed > total) {
    processed = total
    if (success > processed) {
      success = Math.max(processed - failed, 0)
    }
    if (failed > processed) {
      failed = Math.max(processed - success, 0)
    }
  }

  if (total === 0) {
    const derivedTotal = processed + processing + pending
    if (derivedTotal > 0) {
      total = derivedTotal
    }
  }

  if (total > 0) {
    const remaining = total - processed - processing

    if (remaining > 0) {
      pending = pending > 0 ? Math.max(pending, remaining) : remaining
    } else if (pending > total) {
      pending = Math.max(total - processed - processing, 0)
    }
  }

  // Debug logging
  console.log('calculateTaskProgress for task', task.id, ':', {
    task: {
      groupsCount: task.groupsCount,
      groupIds: task.groupIds?.length,
      stats: task.stats
    },
    calculated: {
      total,
      processed,
      success,
      failed,
      processing,
      pending,
      hasTotals: total > 0
    }
  })

  return {
    total,
    processed,
    success,
    failed,
    processing,
    pending,
    hasTotals: total > 0
  }
}

export const isTaskActive = (task: Task): boolean => {
  if (!task) {
    return false
  }

  if (task.status === 'completed' || task.status === 'failed') {
    return false
  }

  if (task.status === 'running' || task.status === 'processing' || task.status === 'pending') {
    return true
  }

  const progress = calculateTaskProgress(task)

  if (progress.processing > 0 || progress.pending > 0) {
    return true
  }

  if (progress.total > 0 && progress.processed < progress.total) {
    return true
  }

  return false
}
