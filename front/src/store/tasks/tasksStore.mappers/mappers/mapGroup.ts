import type { TaskDetails } from '../../tasksStore.types'
import {
  firstDefined,
  normalizeId,
  normalizeGroupStatusValue,
  deriveGroupStatus,
  parseJsonObject,
  hasObjectEntries,
  findGroupMetadata,
} from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'
import { mapGroupProgress } from './mapGroupProgress'

export const mapGroup = (
  group: unknown,
  index: number,
  fallbackStatus: string
): TaskDetails['groups'][number] => {
  if (!group || typeof group !== 'object') {
    const fallbackId = normalizeId(index + 1)
    const metadata = findGroupMetadata(fallbackId)
    return {
      groupId: metadata?.id ?? fallbackId,
      groupName:
        metadata?.name ??
        (typeof group === 'string' && group.trim() !== '' ? group : `Группа ${index + 1}`),
      status: normalizeGroupStatusValue(fallbackStatus),
      error: null,
      parsedData: null,
      progressPercent: null,
      processedCount: null,
      totalCount: null,
      currentIndex: null,
      remainingCount: null,
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
    typeof data.completed === 'boolean' ? (data.completed ? 'success' : 'failed') : undefined
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
  const errorText =
    typeof errorCandidate === 'string' && errorCandidate.trim() !== ''
      ? errorCandidate.trim()
      : null

  const normalizedStatus = normalizeGroupStatusValue(statusCandidate ?? fallbackStatus)
  const finalStatus = deriveGroupStatus(normalizedStatus, {
    error: errorText,
    parsedData,
  })

  const progress = mapGroupProgress(data, parsedDataCandidate)

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
    ...progress,
  }
}
