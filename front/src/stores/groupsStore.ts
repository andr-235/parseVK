import { create } from 'zustand'
import toast from 'react-hot-toast'
import type { GroupsState } from '../types/stores'
import type { IRegionGroupSearchItem } from '../types/api'
import { groupsService } from '../services/groupsService'

const updateRegionSearchAfterGroupAdded = (
  regionSearch: GroupsState['regionSearch'],
  group: IRegionGroupSearchItem,
) => {
  const normalizedGroup = { ...group, existsInDb: true }

  const updatedItems = regionSearch.items.map((item) =>
    item.id === group.id ? normalizedGroup : item
  )

  const updatedMissing = regionSearch.missing.filter(
    (item) => item.id !== group.id
  )

  const alreadyInDb = regionSearch.existsInDb.some(
    (item) => item.id === group.id
  )

  const updatedExistsInDb = alreadyInDb
    ? regionSearch.existsInDb
    : [...regionSearch.existsInDb, normalizedGroup]

  return {
    ...regionSearch,
    items: updatedItems,
    missing: updatedMissing,
    existsInDb: updatedExistsInDb,
  }
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  isLoading: false,
  regionSearch: {
    total: 0,
    items: [],
    missing: [],
    existsInDb: [],
    isLoading: false,
    error: null
  },

  fetchGroups: async () => {
    set({ isLoading: true })
    try {
      const groups = await groupsService.fetchGroups()
      set({ groups, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addGroup: async (name, description = '', options?: { silent?: boolean }) => {
    try {
      const group = await groupsService.addGroup(name, description, options)
      if (group) {
        set((state) => {
          const existingIndex = state.groups.findIndex((item) => item.id === group.id)
          if (existingIndex === -1) {
            return { groups: [...state.groups, group] }
          }

          const updatedGroups = state.groups.slice()
          updatedGroups[existingIndex] = group
          return { groups: updatedGroups }
        })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  deleteGroup: async (id) => {
    try {
      await groupsService.deleteGroup(id)
      set((state) => ({
        groups: state.groups.filter(group => group.id !== id)
      }))
    } catch {
      // Error handled in service
    }
  },

  loadFromFile: async (file) => {
    const result = await groupsService.uploadGroupsFile(file)
    await get().fetchGroups()
    return result
  },

  deleteAllGroups: async () => {
    set({ isLoading: true })
    try {
      await groupsService.deleteAllGroups()
      set({ groups: [], isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  resetRegionSearch: () => {
    set((state) => ({
      regionSearch: {
        ...state.regionSearch,
        total: 0,
        items: [],
        missing: [],
        existsInDb: [],
        isLoading: false,
        error: null
      }
    }))
  },

  searchRegionGroups: async () => {
    const { regionSearch } = get()
    set({
      regionSearch: {
        ...regionSearch,
        isLoading: true,
        error: null
      }
    })

    try {
      const response = await groupsService.searchRegionGroups()

      set((state) => ({
        regionSearch: {
          ...state.regionSearch,
          total: response.total,
          items: response.groups,
          missing: response.missing,
          existsInDb: response.existsInDb,
          isLoading: false,
          error: null
        }
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось выполнить поиск групп'

      set((state) => ({
        regionSearch: {
          ...state.regionSearch,
          isLoading: false,
          error: errorMessage
        }
      }))

      throw error
    }
  },

  addGroupFromRegionSearch: async (group: IRegionGroupSearchItem) => {
    const identifier = group.screen_name
      ? `https://vk.com/${group.screen_name}`
      : `club${group.id}`

    const success = await get().addGroup(identifier, group.description ?? '')

    if (!success) {
      return false
    }

    set((state) => ({
      regionSearch: updateRegionSearchAfterGroupAdded(state.regionSearch, group)
    }))

    return true
  },

  addSelectedRegionSearchGroups: async (groups: IRegionGroupSearchItem[]) => {
    const uniqueGroupsMap = new Map<number, IRegionGroupSearchItem>()
    groups.forEach((group) => {
      uniqueGroupsMap.set(group.id, group)
    })
    const groupsToProcess = Array.from(uniqueGroupsMap.values())
    if (!groupsToProcess.length) {
      return { successCount: 0, failedIds: [] as number[] }
    }

    const failedIds: number[] = []
    let successCount = 0

    for (const group of groupsToProcess) {
      const identifier = group.screen_name
        ? `https://vk.com/${group.screen_name}`
        : `club${group.id}`

      const success = await get().addGroup(identifier, group.description ?? '', { silent: true })

      if (!success) {
        failedIds.push(group.id)
        continue
      }

      successCount += 1
      set((state) => ({
        regionSearch: updateRegionSearchAfterGroupAdded(state.regionSearch, group)
      }))
    }

    if (successCount > 0) {
      toast.success(`Добавлено групп: ${successCount}`)
    }

    if (failedIds.length > 0) {
      toast.error(`Не удалось добавить групп: ${failedIds.length}`)
    }

    return {
      successCount,
      failedIds
    }
  },

  removeRegionSearchGroup: (vkGroupId) => {
    set((state) => ({
      regionSearch: {
        ...state.regionSearch,
        missing: state.regionSearch.missing.filter((item) => item.id !== vkGroupId)
      }
    }))
  }
}))
