import { API_URL } from './config'
import type {
  ITaskAutomationRunResponse,
  ITaskAutomationSettings,
} from '../types/api'

export interface UpdateTaskAutomationSettingsRequest {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
}

export const taskAutomationApi = {
  async getSettings(): Promise<ITaskAutomationSettings> {
    const response = await fetch(`${API_URL}/tasks/automation/settings`)

    if (!response.ok) {
      throw new Error('Failed to load automation settings')
    }

    return response.json()
  },

  async updateSettings(
    payload: UpdateTaskAutomationSettingsRequest,
  ): Promise<ITaskAutomationSettings> {
    const response = await fetch(`${API_URL}/tasks/automation/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to update automation settings')
    }

    return response.json()
  },

  async runNow(): Promise<ITaskAutomationRunResponse> {
    const response = await fetch(`${API_URL}/tasks/automation/run`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to trigger automation run')
    }

    return response.json()
  },
}
