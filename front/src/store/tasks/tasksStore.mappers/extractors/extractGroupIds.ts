import { normalizeId } from '../../tasksStore.utils'
import type { UnknownRecord } from '../../tasksStore.utils'

export interface ExtractedGroupIds {
  groupIds: Array<number | string> | null
  groupIdsCount: number | null
}

export const extractGroupIds = (
  source: UnknownRecord,
  description: UnknownRecord | null
): ExtractedGroupIds => {
  const groupIdsFromSource = Array.isArray(source.groupIds) ? source.groupIds : null
  const groupIdsFromDescription = Array.isArray(description?.groupIds) ? description.groupIds : null

  const resolvedGroupIdsRaw = groupIdsFromSource ?? groupIdsFromDescription

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

  return {
    groupIds: normalizedGroupIds,
    groupIdsCount,
  }
}
