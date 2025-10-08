import { create } from 'zustand'
import type { GroupsState } from '../types/stores'
import { groupsService } from '../services/groupsService'

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  isLoading: false,

  fetchGroups: async () => {
    set({ isLoading: true })
    try {
      const groups = await groupsService.fetchGroups()
      set({ groups, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addGroup: async (name, description = '') => {
    try {
      const group = await groupsService.addGroup(name, description)
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
  }
}))
