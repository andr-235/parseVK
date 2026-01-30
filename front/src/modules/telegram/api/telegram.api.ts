import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
import type {
  TelegramSessionConfirmRequest,
  TelegramSessionConfirmResponse,
  TelegramSessionStartRequest,
  TelegramSessionStartResponse,
  TelegramSettings,
  TelegramSettingsRequest,
  TelegramSyncRequest,
  TelegramSyncResponse,
} from '@/shared/types'

export const telegramService = {
  async syncChat(payload: TelegramSyncRequest): Promise<TelegramSyncResponse> {
    try {
      const response = await createRequest(`${API_URL}/telegram/sync`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<TelegramSyncResponse>(
        response,
        'Не удалось синхронизировать чат Telegram'
      )
      toast.success('Синхронизация Telegram завершена')
      return result
    } catch (error) {
      toast.error('Не удалось синхронизировать чат Telegram')
      throw error
    }
  },

  async startSession(payload: TelegramSessionStartRequest): Promise<TelegramSessionStartResponse> {
    try {
      const response = await createRequest(`${API_URL}/telegram/session/start`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<TelegramSessionStartResponse>(
        response,
        'Не удалось отправить код Telegram'
      )
      toast.success('Код отправлен в Telegram')
      return result
    } catch (error) {
      toast.error('Не удалось отправить код Telegram')
      throw error
    }
  },

  async confirmSession(
    payload: TelegramSessionConfirmRequest
  ): Promise<TelegramSessionConfirmResponse> {
    try {
      const response = await createRequest(`${API_URL}/telegram/session/confirm`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<TelegramSessionConfirmResponse>(
        response,
        'Не удалось подтвердить код Telegram'
      )
      toast.success('Сессия Telegram подтверждена')
      return result
    } catch (error) {
      toast.error('Не удалось подтвердить код Telegram')
      throw error
    }
  },

  async getCurrentSession(): Promise<TelegramSessionConfirmResponse | null> {
    try {
      const response = await createRequest(`${API_URL}/telegram/session`, {
        method: 'GET',
      })

      if (response.status === 404) {
        return null
      }

      return await handleResponse<TelegramSessionConfirmResponse>(
        response,
        'Не удалось получить текущую сессию'
      )
    } catch (error) {
      toast.error('Не удалось получить текущую сессию')
      throw error
    }
  },

  async getSettings(): Promise<TelegramSettings | null> {
    try {
      const response = await createRequest(`${API_URL}/telegram/settings`, {
        method: 'GET',
      })

      if (response.status === 404) {
        return null
      }

      return await handleResponse<TelegramSettings>(
        response,
        'Не удалось получить настройки Telegram'
      )
    } catch (error) {
      toast.error('Не удалось получить настройки Telegram')
      throw error
    }
  },

  async updateSettings(payload: TelegramSettingsRequest): Promise<TelegramSettings> {
    try {
      const response = await createRequest(`${API_URL}/telegram/settings`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<TelegramSettings>(
        response,
        'Не удалось сохранить настройки Telegram'
      )
      toast.success('Настройки Telegram сохранены')
      return result
    } catch (error) {
      toast.error('Не удалось сохранить настройки Telegram')
      throw error
    }
  },
}
