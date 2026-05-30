import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type {
  IWatchlistAuthorDetailsResponse,
  IWatchlistAuthorListResponse,
  IWatchlistAuthorResponse,
  IWatchlistSettingsResponse,
} from '@/shared/types'
import type { WatchlistStatus } from '@/pages/watchlist/types'

interface ListParams {
  offset?: number
  limit?: number
  excludeStopped?: boolean
}

interface WatchlistRequestOptions {
  silent?: boolean
}

export const watchlistService = {
  async getAuthors(
    params?: ListParams,
    options?: WatchlistRequestOptions
  ): Promise<IWatchlistAuthorListResponse> {
    try {
      return await apiClient.get<IWatchlistAuthorListResponse>('/v1/watchlist/authors', {
        offset: params?.offset,
        limit: params?.limit,
        excludeStopped: params?.excludeStopped,
      })
    } catch (error) {
      if (!options?.silent) {
        toast.error('Не удалось загрузить список авторов "На карандаше"')
      }
      throw error
    }
  },

  async createAuthor(payload: {
    commentId?: number
    authorVkId?: number
  }): Promise<IWatchlistAuthorResponse> {
    try {
      const result = await apiClient.post<IWatchlistAuthorResponse>(
        '/v1/watchlist/authors',
        payload
      )
      toast.success('Автор добавлен в список "На карандаше"')
      return result
    } catch (error) {
      toast.error('Не удалось добавить автора в список "На карандаше"')
      throw error
    }
  },

  async getAuthorDetails(
    id: number,
    params?: ListParams,
    options?: WatchlistRequestOptions
  ): Promise<IWatchlistAuthorDetailsResponse> {
    try {
      return await apiClient.get<IWatchlistAuthorDetailsResponse>(
        `/v1/watchlist/authors/${id}`,
        {
          offset: params?.offset,
          limit: params?.limit,
        }
      )
    } catch (error) {
      if (!options?.silent) {
        toast.error('Не удалось загрузить данные автора "На карандаше"')
      }
      throw error
    }
  },

  async updateAuthor(
    id: number,
    payload: { status?: WatchlistStatus }
  ): Promise<IWatchlistAuthorResponse> {
    try {
      return await apiClient.patch<IWatchlistAuthorResponse>(
        `/v1/watchlist/authors/${id}`,
        payload
      )
    } catch (error) {
      toast.error('Не удалось обновить данные автора')
      throw error
    }
  },

  async getSettings(options?: WatchlistRequestOptions): Promise<IWatchlistSettingsResponse> {
    try {
      return await apiClient.get<IWatchlistSettingsResponse>('/v1/watchlist/settings')
    } catch (error) {
      if (!options?.silent) {
        toast.error('Не удалось загрузить настройки мониторинга авторов')
      }
      throw error
    }
  },

  async updateSettings(
    payload: Partial<IWatchlistSettingsResponse>
  ): Promise<IWatchlistSettingsResponse> {
    try {
      const result = await apiClient.patch<IWatchlistSettingsResponse>(
        '/v1/watchlist/settings',
        payload
      )
      toast.success('Настройки мониторинга обновлены')
      return result
    } catch (error) {
      toast.error('Не удалось обновить настройки мониторинга авторов')
      throw error
    }
  },
}
