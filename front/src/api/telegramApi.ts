import { API_URL } from './config'
import type {
  TelegramSessionConfirmRequest,
  TelegramSessionConfirmResponse,
  TelegramSessionStartRequest,
  TelegramSessionStartResponse,
  TelegramSyncRequest,
  TelegramSyncResponse,
} from '@/types/api'

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

  async startSession(payload: TelegramSessionStartRequest): Promise<TelegramSessionStartResponse> {
    const response = await fetch(`${API_URL}/telegram/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Не удалось отправить код Telegram')
    }

    return response.json() as Promise<TelegramSessionStartResponse>
  },

  async confirmSession(payload: TelegramSessionConfirmRequest): Promise<TelegramSessionConfirmResponse> {
    const response = await fetch(`${API_URL}/telegram/session/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Не удалось подтвердить код Telegram')
    }

    return response.json() as Promise<TelegramSessionConfirmResponse>
  },

  async getCurrentSession(): Promise<TelegramSessionConfirmResponse | null> {
    const response = await fetch(`${API_URL}/telegram/session`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const message = await response.text()
      throw new Error(message || 'Не удалось получить текущую сессию')
    }

    return response.json() as Promise<TelegramSessionConfirmResponse>
  },
}

