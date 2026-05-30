import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type { ITaskAutomationRunResponse, ITaskAutomationSettings } from '@/shared/types'

const TASK_AUTOMATION_API_PATH = '/v1/tasks/automation'

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
      return await apiClient.get<ITaskAutomationSettings>(`${TASK_AUTOMATION_API_PATH}/settings`)
    } catch (error) {
      toast.error('Не удалось загрузить настройки автозапуска')
      throw error
    }
  },

  async updateSettings(
    payload: UpdateTaskAutomationSettingsRequest
  ): Promise<ITaskAutomationSettings> {
    try {
      const settings = await apiClient.post<ITaskAutomationSettings>(
        `${TASK_AUTOMATION_API_PATH}/settings`,
        payload
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
      const result = await apiClient.post<ITaskAutomationRunResponse>(
        `${TASK_AUTOMATION_API_PATH}/run`
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
