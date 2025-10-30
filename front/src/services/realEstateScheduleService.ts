import toast from 'react-hot-toast'

import { realEstateScheduleApi } from '@/api/realEstateScheduleApi'
import type {
  RealEstateManualRunOptions,
  RealEstateManualRunResponse,
  RealEstateScheduleSettings,
  RealEstateScheduleUpdatePayload,
} from '@/types/realEstate'

export const realEstateScheduleService = {
  async fetchSettings(): Promise<RealEstateScheduleSettings> {
    try {
      return await realEstateScheduleApi.getSettings()
    } catch (error) {
      toast.error('Не удалось загрузить расписание парсинга недвижимости')
      throw error
    }
  },

  async updateSettings(
    payload: RealEstateScheduleUpdatePayload,
  ): Promise<RealEstateScheduleSettings> {
    try {
      const settings = await realEstateScheduleApi.updateSettings(payload)
      toast.success('Расписание парсинга обновлено')
      return settings
    } catch (error) {
      toast.error('Не удалось обновить расписание парсинга')
      throw error
    }
  },

  async runNow(
    options?: RealEstateManualRunOptions,
  ): Promise<RealEstateManualRunResponse> {
    try {
      const response = await realEstateScheduleApi.runNow(options)

      if (response.started) {
        toast.success('Запуск парсинга недвижимости начат')
      } else {
        toast.error(response.reason ?? 'Не удалось запустить парсинг недвижимости')
      }

      return response
    } catch (error) {
      toast.error('Не удалось запустить парсинг недвижимости')
      throw error
    }
  },
}
