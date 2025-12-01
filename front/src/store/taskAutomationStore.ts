import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/hooks/queryKeys'
import type { TaskAutomationSettings } from '../types'
import { taskAutomationService } from '../services/taskAutomationService'
import type { UpdateTaskAutomationSettingsRequest } from '../services/taskAutomationService'

interface TaskAutomationStore {
  settings: TaskAutomationSettings | null
  isLoading: boolean
  isUpdating: boolean
  isTriggering: boolean
  fetchSettings: () => Promise<TaskAutomationSettings | null>
  updateSettings: (payload: UpdateTaskAutomationSettingsRequest) => Promise<boolean>
  runNow: () => Promise<boolean>
}

export const useTaskAutomationStore = create<TaskAutomationStore>()(
  devtools(
    (set, get) => ({
      settings: null,
      isLoading: false,
      isUpdating: false,
      isTriggering: false,

      async fetchSettings() {
        if (get().isLoading) {
          return get().settings
        }

        set({ isLoading: true })

        try {
          const settings = await queryClient.ensureQueryData({
            queryKey: queryKeys.taskAutomation,
            queryFn: taskAutomationService.fetchSettings,
          })
          set({ settings })
          return settings
        } catch (error) {
          console.error('Failed to fetch task automation settings', error)
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      async updateSettings(payload) {
        set({ isUpdating: true })

        try {
          const settings = await taskAutomationService.updateSettings(payload)
          set({ settings, isUpdating: false })
          void queryClient.invalidateQueries({ queryKey: queryKeys.taskAutomation, refetchType: 'active' })
          return true
        } catch (error) {
          console.error('Failed to update task automation settings', error)
          set({ isUpdating: false })
          return false
        }
      },

      async runNow() {
        if (get().isTriggering) {
          return false
        }

        set({ isTriggering: true })

        try {
          const response = await taskAutomationService.runAutomation()
          set({ settings: response.settings, isTriggering: false })
          void queryClient.invalidateQueries({ queryKey: queryKeys.taskAutomation, refetchType: 'active' })
          return response.started
        } catch (error) {
          console.error('Failed to trigger task automation', error)
          set({ isTriggering: false })
          return false
        }
      },
    }),
    { name: 'task-automation-store' },
  ),
)
