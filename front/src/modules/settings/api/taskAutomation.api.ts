import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
import type { ITaskAutomationRunResponse, ITaskAutomationSettings } from '@/shared/types'

export interface UpdateTaskAutomationSettingsRequest {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
}

export const taskAutomationService = {
  async fetchSettings(): Promise<ITaskAutomationSettings> {
    try {
      const response = await createRequest(`${API_URL}/tasks/automation/settings`)
      return await handleResponse<ITaskAutomationSettings>(
        response,
        'Failed to load automation settings'
      )
    } catch (error) {
      toast.error('Не удалось загрузить настройки автозапуска')
      throw error
    }
  },

  async updateSettings(
    payload: UpdateTaskAutomationSettingsRequest
  ): Promise<ITaskAutomationSettings> {
    try {
      const response = await createRequest(`${API_URL}/tasks/automation/settings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const settings = await handleResponse<ITaskAutomationSettings>(
        response,
        'Failed to update automation settings'
      )
      toast.success('Настройки автозапуска сохранены')
      return settings
    } catch (error) {
      toast.error('Не удалось сохранить настройки автозапуска')
      throw error
    }
  },

  async runAutomation(): Promise<ITaskAutomationRunResponse> {
    try {
      const response = await createRequest(`${API_URL}/tasks/automation/run`, {
        method: 'POST',
      })

      const result = await handleResponse<ITaskAutomationRunResponse>(
        response,
        'Failed to trigger automation run'
      )

      if (result.started) {
        toast.success('Запущена автоматическая задача на парсинг')
      } else if (result.reason) {
        toast('Автозапуск не запущен: ' + result.reason)
      }

      return result
    } catch (error) {
      toast.error('Не удалось запустить автозадачу')
      throw error
    }
  },
}
