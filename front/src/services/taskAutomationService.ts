import toast from 'react-hot-toast'
import { taskAutomationApi, type UpdateTaskAutomationSettingsRequest } from '../api/taskAutomationApi'
import type { ITaskAutomationRunResponse, ITaskAutomationSettings } from '../types/api'

export const taskAutomationService = {
  async fetchSettings(): Promise<ITaskAutomationSettings> {
    try {
      return await taskAutomationApi.getSettings()
    } catch (error) {
      toast.error('Не удалось загрузить настройки автозапуска')
      throw error
    }
  },

  async updateSettings(
    payload: UpdateTaskAutomationSettingsRequest,
  ): Promise<ITaskAutomationSettings> {
    try {
      const settings = await taskAutomationApi.updateSettings(payload)
      toast.success('Настройки автозапуска сохранены')
      return settings
    } catch (error) {
      toast.error('Не удалось сохранить настройки автозапуска')
      throw error
    }
  },

  async runAutomation(): Promise<ITaskAutomationRunResponse> {
    try {
      const response = await taskAutomationApi.runNow()

      if (response.started) {
        toast.success('Запущена автоматическая задача на парсинг')
      } else if (response.reason) {
        toast('Автозапуск не запущен: ' + response.reason)
      }

      return response
    } catch (error) {
      toast.error('Не удалось запустить автозадачу')
      throw error
    }
  },
}
