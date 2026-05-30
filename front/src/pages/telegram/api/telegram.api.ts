import toast from 'react-hot-toast'
import { apiClient, ApiError } from '@/shared/api'
import type {
  TelegramSessionConfirmRequest,
  TelegramSessionConfirmResponse,
  TelegramSessionStartRequest,
  TelegramSessionStartResponse,
  TelegramDiscussionSyncRequest,
  TelegramDiscussionSyncResponse,
  TelegramSettings,
  TelegramSettingsRequest,
  TelegramSyncRequest,
  TelegramSyncResponse,
} from '@/shared/types'

export const telegramService = {
  async syncChat(payload: TelegramSyncRequest): Promise<TelegramSyncResponse> {
    const result = await apiClient.post<TelegramSyncResponse>('/telegram/sync', payload)
    toast.success('Синхронизация Telegram завершена')
    return result
  },

  async syncDiscussionAuthors(
    payload: TelegramDiscussionSyncRequest
  ): Promise<TelegramDiscussionSyncResponse> {
    const result = await apiClient.post<TelegramDiscussionSyncResponse>('/telegram/discussion-authors/sync', payload)
    toast.success('Авторы комментариев Telegram загружены')
    return result
  },

  async startSession(payload: TelegramSessionStartRequest): Promise<TelegramSessionStartResponse> {
    try {
      const result = await apiClient.post<TelegramSessionStartResponse>('/telegram/session/start', payload)
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
      const result = await apiClient.post<TelegramSessionConfirmResponse>('/telegram/session/confirm', payload)
      toast.success('Сессия Telegram подтверждена')
      return result
    } catch (error) {
      toast.error('Не удалось подтвердить код Telegram')
      throw error
    }
  },

  async getCurrentSession(): Promise<TelegramSessionConfirmResponse | null> {
    try {
      return await apiClient.get<TelegramSessionConfirmResponse>('/telegram/session')
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) {
        return null
      }
      toast.error('Не удалось получить текущую сессию')
      throw error
    }
  },

  async getSettings(): Promise<TelegramSettings | null> {
    try {
      return await apiClient.get<TelegramSettings>('/telegram/settings')
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) {
        return null
      }
      toast.error('Не удалось получить настройки Telegram')
      throw error
    }
  },

  async updateSettings(payload: TelegramSettingsRequest): Promise<TelegramSettings> {
    try {
      const result = await apiClient.patch<TelegramSettings>('/telegram/settings', payload)
      toast.success('Настройки Telegram сохранены')
      return result
    } catch (error) {
      toast.error('Не удалось сохранить настройки Telegram')
      throw error
    }
  },
}
