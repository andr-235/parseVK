import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TaskAutomationSettings } from '../types'
import { taskAutomationService } from '../services/taskAutomationService'
import type { UpdateTaskAutomationSettingsRequest } from '../api/taskAutomationApi'

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
          const settings = await taskAutomationService.fetchSettings()
          set({ settings, isLoading: false })
          return settings
        } catch (error) {
          set({ isLoading: false })
          return null
        }
      },

      async updateSettings(payload) {
        set({ isUpdating: true })

        try {
          const settings = await taskAutomationService.updateSettings(payload)
          set({ settings, isUpdating: false })
          return true
        } catch (error) {
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
          return response.started
        } catch (error) {
          set({ isTriggering: false })
          return false
        }
      },
    }),
    { name: 'task-automation-store' },
  ),
)
