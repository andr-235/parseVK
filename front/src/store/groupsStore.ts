import { create } from 'zustand'
import toast from 'react-hot-toast'
import type { GroupsState } from '@/shared/types'
import type { IRegionGroupSearchItem } from '@/shared/types'
import type { Group } from '@/types'
import { groupsService } from '@/modules/groups/api/groups.api'

export const GROUPS_PAGE_LIMIT = 50

const updateRegionSearchAfterGroupAdded = (
  regionSearch: GroupsState['regionSearch'],
  group: IRegionGroupSearchItem
) => {
  const normalizedGroup = { ...group, existsInDb: true }

  const updatedItems = regionSearch.items.map((item) =>
    item.id === group.id ? normalizedGroup : item
  )

  const updatedMissing = regionSearch.missing.filter((item) => item.id !== group.id)

  const alreadyInDb = regionSearch.existsInDb.some((item) => item.id === group.id)

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
  total: 0,
  page: 0,
  limit: GROUPS_PAGE_LIMIT,
  hasMore: true,
  isLoading: false,
  isProcessing: false,
  isLoadingMore: false,
  regionSearch: {
    total: 0,
    items: [],
    missing: [],
    existsInDb: [],
    isLoading: false,
    error: null,
  },

  fetchGroups: async (options) => {
    const state = get()
    if (!options?.reset && state.page > 0 && state.groups.length > 0) {
      return
    }

    set({ isLoading: true })
    try {
      const response = await groupsService.fetchGroups({ page: 1, limit: state.limit })
      if (!Array.isArray(response.items)) {
        throw new Error(
          `Invalid API response: expected 'items' to be an array, got ${typeof response.items}. Response: ${JSON.stringify(response)}`
        )
      }
      set({
        groups: response.items,
        total: response.total,
        page: response.page,
        limit: response.limit,
        hasMore: response.hasMore,
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[groupsStore] fetchGroups error', error)
      }
    } finally {
      set({ isLoading: false })
    }
  },

  loadMoreGroups: async () => {
    const state = get()
    if (!state.hasMore || state.isLoadingMore) {
      return
    }

    const nextPage = state.page + 1
    set({ isLoadingMore: true })
    try {
      const response = await groupsService.fetchGroups({ page: nextPage, limit: state.limit })
      if (!Array.isArray(response.items)) {
        throw new Error(
          `Invalid API response: expected 'items' to be an array, got ${typeof response.items}. Response: ${JSON.stringify(response)}`
        )
      }
      set((current) => {
        const combined = [...current.groups, ...response.items]
        const uniqueMap = new Map<number, (typeof combined)[number]>()
        combined.forEach((group) => {
          uniqueMap.set(group.id, group)
        })

        return {
          groups: Array.from(uniqueMap.values()),
          total: response.total,
          page: response.page,
          limit: response.limit,
          hasMore: response.hasMore,
          isLoadingMore: false,
        }
      })
    } catch (error) {
      set({ isLoadingMore: false })
      throw error
    }
  },

  fetchAllGroups: async () => {
    set({ isLoading: true })
    try {
      const allGroups: Group[] = []
      let page = 1
      let hasMore = true
      const limit = 100

      while (hasMore) {
        const response = await groupsService.fetchGroups({ page, limit })
        if (!Array.isArray(response.items)) {
          throw new Error(
            `Invalid API response: expected 'items' to be an array, got ${typeof response.items}. Response: ${JSON.stringify(response)}`
          )
        }
        allGroups.push(...response.items)
        hasMore = response.hasMore
        page++
      }

      set({
        groups: allGroups,
        total: allGroups.length,
        page: 1,
        limit,
        hasMore: false,
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[groupsStore] fetchAllGroups error', error)
      }
    } finally {
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
            return {
              groups: [group, ...state.groups],
              total: state.total + 1,
            }
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
        groups: state.groups.filter((group) => group.id !== id),
        total: Math.max(0, state.total - 1),
      }))
    } catch {
      // Error handled in service
    }
  },

  loadFromFile: async (file) => {
    set({ isProcessing: true, isLoading: true })
    try {
      const result = await groupsService.uploadGroupsFile(file)
      await get().fetchGroups({ reset: true })
      return result
    } finally {
      set({ isProcessing: false, isLoading: false })
    }
  },

  deleteAllGroups: async () => {
    set({ isProcessing: true, isLoading: true })
    try {
      await groupsService.deleteAllGroups()
      set({
        groups: [],
        total: 0,
        page: 0,
        hasMore: false,
      })
    } finally {
      set({ isProcessing: false, isLoading: false })
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
        error: null,
      },
    }))
  },

  searchRegionGroups: async () => {
    const { regionSearch } = get()
    set({
      regionSearch: {
        ...regionSearch,
        isLoading: true,
        error: null,
      },
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
          error: null,
        },
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось выполнить поиск групп'

      set((state) => ({
        regionSearch: {
          ...state.regionSearch,
          isLoading: false,
          error: errorMessage,
        },
      }))

      throw error
    }
  },

  addGroupFromRegionSearch: async (group: IRegionGroupSearchItem) => {
    const identifier = group.screen_name?.trim()
      ? `https://vk.com/${group.screen_name.trim()}`
      : `club${group.id}`

    const success = await get().addGroup(identifier, group.description ?? '')

    if (!success) {
      return false
    }

    set((state) => ({
      regionSearch: updateRegionSearchAfterGroupAdded(state.regionSearch, group),
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
    const successfulGroups: IRegionGroupSearchItem[] = []

    for (const group of groupsToProcess) {
      const identifier = group.screen_name?.trim()
        ? `https://vk.com/${group.screen_name.trim()}`
        : `club${group.id}`
      const success = await get().addGroup(identifier, group.description ?? '', { silent: true })

      if (!success) {
        failedIds.push(group.id)
        continue
      }

      successfulGroups.push(group)
    }

    if (successfulGroups.length > 0) {
      set((state) => ({
        regionSearch: successfulGroups.reduce(
          (acc, group) => updateRegionSearchAfterGroupAdded(acc, group),
          state.regionSearch
        ),
        total: state.total + successfulGroups.length,
      }))
      void get().fetchGroups({ reset: true })
      toast.success(`Добавлено групп: ${successfulGroups.length}`)
    }

    if (failedIds.length > 0) {
      toast.error(`Не удалось добавить групп: ${failedIds.length}`)
    }

    return {
      successCount: successfulGroups.length,
      failedIds,
    }
  },

  removeRegionSearchGroup: (vkGroupId) => {
    set((state) => ({
      regionSearch: {
        ...state.regionSearch,
        missing: state.regionSearch.missing.filter((item) => item.id !== vkGroupId),
      },
    }))
  },
}))
