import { API_URL } from './config'
import { createRequest, handleResponse } from './utils'
import type {
  ITaskAutomationRunResponse,
  ITaskAutomationSettings,
} from '../types/api'

export interface UpdateTaskAutomationSettingsRequest {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
}

export const taskAutomationApi = {
  async getSettings(): Promise<ITaskAutomationSettings> {
    const response = await fetch(`${API_URL}/tasks/automation/settings`)

    return handleResponse<ITaskAutomationSettings>(response, 'Failed to load automation settings')
  },

  async updateSettings(
    payload: UpdateTaskAutomationSettingsRequest,
  ): Promise<ITaskAutomationSettings> {
    const response = await createRequest(`${API_URL}/tasks/automation/settings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return handleResponse<ITaskAutomationSettings>(response, 'Failed to update automation settings')
  },

  async runNow(): Promise<ITaskAutomationRunResponse> {
    const response = await fetch(`${API_URL}/tasks/automation/run`, {
      method: 'POST',
    })

    return handleResponse<ITaskAutomationRunResponse>(response, 'Failed to trigger automation run')
  },
}
