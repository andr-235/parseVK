import { firstDefined, getNumericFromRecord } from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'

export interface GroupProgress {
  progressPercent: number | null
  processedCount: number | null
  totalCount: number | null
  currentIndex: number | null
  remainingCount: number | null
}

export const mapGroupProgress = (
  data: UnknownRecord,
  parsedData: UnknownRecord | null
): GroupProgress => {
  const progressPercent = firstDefined(
    getNumericFromRecord(
      data,
      'progress',
      'progressPercent',
      'progress_percent',
      'percentage',
      'percent'
    ),
    getNumericFromRecord(
      parsedData,
      'progress',
      'progressPercent',
      'progress_percent',
      'percentage',
      'percent'
    )
  )

  const processedCount = firstDefined(
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
      parsedData,
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

  const totalCount = firstDefined(
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
      parsedData,
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

  const currentIndex = firstDefined(
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
      parsedData,
      'currentPost',
      'currentPostIndex',
      'current',
      'currentIndex',
      'index',
      'step'
    )
  )

  const remainingCount = firstDefined(
    getNumericFromRecord(data, 'remainingPosts', 'remaining', 'left', 'pendingPosts'),
    getNumericFromRecord(parsedData, 'remainingPosts', 'remaining', 'left', 'pendingPosts')
  )

  return {
    progressPercent: progressPercent ?? null,
    processedCount: processedCount ?? null,
    totalCount: totalCount ?? null,
    currentIndex: currentIndex ?? null,
    remainingCount: remainingCount ?? null,
  }
}
