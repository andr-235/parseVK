import type { TaskDetails as TaskDetailsType } from '@/types'
import { getNumberFromObject } from './formatters'

export const pickNumber = (...values: Array<number | null | undefined>): number | null => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }
  return null
}

export const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min
  }
  return Math.max(min, Math.min(max, value))
}

export interface GroupProgressInfo {
  percent: number | null
  processed: number | null
  total: number | null
  current: number | null
  remaining: number | null
}

export const resolveGroupProgress = (
  group: TaskDetailsType['groups'][number],
  parsedData: Record<string, unknown> | null
): GroupProgressInfo | null => {
  const statsData =
    parsedData && typeof parsedData.stats === 'object'
      ? (parsedData.stats as Record<string, unknown>)
      : null

  const percent = pickNumber(
    group.progressPercent ?? null,
    parsedData
      ? getNumberFromObject(parsedData, 'progressPercent', 'progress', 'percentage', 'percent')
      : null,
    statsData
      ? getNumberFromObject(statsData, 'progressPercent', 'progress', 'percentage', 'percent')
      : null
  )

  const processed = pickNumber(
    group.processedCount ?? null,
    parsedData
      ? getNumberFromObject(
          parsedData,
          'processedPosts',
          'processed',
          'processedCount',
          'completedPosts',
          'parsedPosts',
          'done',
          'completed',
          'parsed'
        )
      : null,
    statsData
      ? getNumberFromObject(
          statsData,
          'processedPosts',
          'processed',
          'processedCount',
          'completedPosts',
          'parsedPosts',
          'done',
          'completed',
          'parsed'
        )
      : null
  )

  const total = pickNumber(
    group.totalCount ?? null,
    parsedData
      ? getNumberFromObject(
          parsedData,
          'totalPosts',
          'total',
          'totalCount',
          'postsTotal',
          'targetPosts',
          'plannedPosts',
          'expectedPosts',
          'maxPosts'
        )
      : null,
    statsData
      ? getNumberFromObject(
          statsData,
          'totalPosts',
          'total',
          'totalCount',
          'postsTotal',
          'targetPosts',
          'plannedPosts',
          'expectedPosts',
          'maxPosts'
        )
      : null
  )

  const remaining = pickNumber(
    group.remainingCount ?? null,
    parsedData
      ? getNumberFromObject(parsedData, 'remainingPosts', 'remaining', 'left', 'pendingPosts')
      : null,
    statsData
      ? getNumberFromObject(statsData, 'remainingPosts', 'remaining', 'left', 'pendingPosts')
      : null
  )

  const current = pickNumber(
    group.currentIndex ?? null,
    parsedData
      ? getNumberFromObject(
          parsedData,
          'currentPost',
          'currentPostIndex',
          'current',
          'currentIndex',
          'index',
          'step'
        )
      : null,
    statsData
      ? getNumberFromObject(
          statsData,
          'currentPost',
          'currentPostIndex',
          'current',
          'currentIndex',
          'index',
          'step'
        )
      : null
  )

  const resolvedTotal =
    total ?? (processed != null && remaining != null ? processed + remaining : null)
  const resolvedProcessed =
    processed ??
    (resolvedTotal != null && remaining != null ? Math.max(resolvedTotal - remaining, 0) : null)

  const resolvedPercent =
    percent ??
    (resolvedTotal != null && resolvedProcessed != null && resolvedTotal > 0
      ? (resolvedProcessed / resolvedTotal) * 100
      : null)

  if (
    (resolvedPercent == null || Number.isNaN(resolvedPercent)) &&
    (resolvedProcessed == null || Number.isNaN(resolvedProcessed)) &&
    (resolvedTotal == null || Number.isNaN(resolvedTotal)) &&
    (current == null || Number.isNaN(current)) &&
    (remaining == null || Number.isNaN(remaining))
  ) {
    return null
  }

  return {
    percent: resolvedPercent != null ? clamp(resolvedPercent, 0, 100) : null,
    processed: resolvedProcessed != null ? Math.max(0, resolvedProcessed) : null,
    total: resolvedTotal != null ? Math.max(0, resolvedTotal) : null,
    current: current != null ? Math.max(0, current) : null,
    remaining: remaining != null ? Math.max(0, remaining) : null,
  }
}
