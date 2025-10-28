import { API_URL } from './config'
import type {
  RealEstateManualRunResponse,
  RealEstateScheduleSettings,
  RealEstateScheduleUpdatePayload,
} from '@/types/realEstate'

export const realEstateScheduleApi = {
  async getSettings(): Promise<RealEstateScheduleSettings> {
    const response = await fetch(`${API_URL}/real-estate/schedule`)

    if (!response.ok) {
      throw new Error('Failed to load real estate schedule settings')
    }

    return response.json()
  },

  async updateSettings(
    payload: RealEstateScheduleUpdatePayload,
  ): Promise<RealEstateScheduleSettings> {
    const response = await fetch(`${API_URL}/real-estate/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to update real estate schedule settings')
    }

    return response.json()
  },

  async runNow(): Promise<RealEstateManualRunResponse> {
    const response = await fetch(`${API_URL}/real-estate/schedule/run`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to trigger real estate parsing run')
    }

    return response.json()
  },
}
