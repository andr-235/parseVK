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
    } catch (error) {
      set({ isLoading: false })
    }
  },

  addGroup: async (name, description = '') => {
    try {
      const group = await groupsService.addGroup(name, description)
      if (group) {
        set((state) => ({ groups: [...state.groups, group] }))
        return true
      }
      return false
    } catch (error) {
      return false
    }
  },

  deleteGroup: async (id) => {
    try {
      await groupsService.deleteGroup(id)
      set((state) => ({
        groups: state.groups.filter(group => group.id !== id)
      }))
    } catch (error) {
      // Error handled in service
    }
  },

  loadFromFile: async (file) => {
    const result = await groupsService.uploadGroupsFile(file)
    await get().fetchGroups()
    return result
  }
}))
