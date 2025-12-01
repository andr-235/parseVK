import { API_URL } from './config'
import { createRequest, handleResponse } from './utils'
import type {
  TelegramSessionConfirmRequest,
  TelegramSessionConfirmResponse,
  TelegramSessionStartRequest,
  TelegramSessionStartResponse,
  TelegramSettings,
  TelegramSettingsRequest,
  TelegramSyncRequest,
  TelegramSyncResponse,
} from '@/types/api'

export const telegramApi = {
  async syncChat(payload: TelegramSyncRequest): Promise<TelegramSyncResponse> {
    const response = await createRequest(`${API_URL}/telegram/sync`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return handleResponse<TelegramSyncResponse>(response, 'Не удалось синхронизировать чат Telegram')
  },

  async startSession(payload: TelegramSessionStartRequest): Promise<TelegramSessionStartResponse> {
    const response = await createRequest(`${API_URL}/telegram/session/start`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return handleResponse<TelegramSessionStartResponse>(response, 'Не удалось отправить код Telegram')
  },

  async confirmSession(payload: TelegramSessionConfirmRequest): Promise<TelegramSessionConfirmResponse> {
    const response = await createRequest(`${API_URL}/telegram/session/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return handleResponse<TelegramSessionConfirmResponse>(response, 'Не удалось подтвердить код Telegram')
  },

  async getCurrentSession(): Promise<TelegramSessionConfirmResponse | null> {
    const response = await createRequest(`${API_URL}/telegram/session`, {
      method: 'GET',
    })

    if (response.status === 404) {
      return null
    }

    return handleResponse<TelegramSessionConfirmResponse>(response, 'Не удалось получить текущую сессию')
  },

  async getSettings(): Promise<TelegramSettings | null> {
    const response = await createRequest(`${API_URL}/telegram/settings`, {
      method: 'GET',
    })

    if (response.status === 404) {
      return null
    }

    return handleResponse<TelegramSettings>(response, 'Не удалось получить настройки Telegram')
  },

  async updateSettings(payload: TelegramSettingsRequest): Promise<TelegramSettings> {
    const response = await createRequest(`${API_URL}/telegram/settings`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return handleResponse<TelegramSettings>(response, 'Не удалось сохранить настройки Telegram')
  },
}

