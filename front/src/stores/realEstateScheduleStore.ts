import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import type {
  RealEstateScheduleState,
} from '@/types/stores'
import type {
  RealEstateManualRunOptions,
  RealEstateManualRunResponse,
  RealEstateScheduleSettings,
  RealEstateScheduleUpdatePayload,
} from '@/types/realEstate'
import { realEstateScheduleService } from '@/services/realEstateScheduleService'

export const useRealEstateScheduleStore = create<RealEstateScheduleState>()(
  devtools((set) => ({
    settings: null,
    summary: null,
    isLoading: false,
    isUpdating: false,
    isRunning: false,

    async fetchSettings(): Promise<RealEstateScheduleSettings | null> {
      set({ isLoading: true })

      try {
        const settings = await realEstateScheduleService.fetchSettings()
        set({ settings, isLoading: false })
        return settings
      } catch (error) {
        set({ isLoading: false })
        return null
      }
    },

    async updateSettings(
      payload: RealEstateScheduleUpdatePayload,
    ): Promise<boolean> {
      set({ isUpdating: true })

      try {
        const settings = await realEstateScheduleService.updateSettings(payload)
        set({ settings, isUpdating: false })
        return true
      } catch (error) {
        set({ isUpdating: false })
        return false
      }
    },

    async runNow(options?: RealEstateManualRunOptions): Promise<boolean> {
      set({ isRunning: true })

      try {
        const response: RealEstateManualRunResponse =
          await realEstateScheduleService.runNow(options)

        set((state) => ({
          settings: response.settings,
          summary: response.summary ?? state.summary,
          isRunning: false,
        }))

        return response.started
      } catch (error) {
        set({ isRunning: false })
        return false
      }
    },
  }), { name: 'real-estate-schedule-store' }),
)
