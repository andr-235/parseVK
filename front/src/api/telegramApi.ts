import { API_URL } from './config'
import type { TelegramSyncRequest, TelegramSyncResponse } from '@/types/api'

export const telegramApi = {
  async syncChat(payload: TelegramSyncRequest): Promise<TelegramSyncResponse> {
    const response = await fetch(`${API_URL}/telegram/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Не удалось синхронизировать чат Telegram')
    }

    return response.json() as Promise<TelegramSyncResponse>
  },
}

