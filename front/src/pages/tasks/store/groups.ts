import { useGroupsStore } from '@/pages/groups/store/groupsStore'
import type { GroupMetadata } from './tasksStore.types'
import { normalizeId } from './ids'
import { toNumber, type UnknownRecord } from './records'

export const ensureGroupsLoaded = async (): Promise<void> => {
  const state = useGroupsStore.getState()
  if (state.groups.length === 0 && typeof state.fetchGroups === 'function') {
    try {
      await state.fetchGroups()
    } catch {
      // Group loading is best-effort for task enrichment.
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
    displayName = 'Р“СЂСѓРїРїР° ' + String(groupId)
  }

  const normalizedId = match.id != null ? normalizeId(match.id) : normalizeId(groupId)

  return {
    id: normalizedId,
    name: displayName,
  }
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
