import toast from 'react-hot-toast'
import { GATEWAY_API_URL } from '@/api/common'
import { buildQueryString, createRequest, handleResponse } from '@/api/common'
import type {
  IWatchlistAuthorDetailsResponse,
  IWatchlistAuthorListResponse,
  IWatchlistAuthorResponse,
  IWatchlistSettingsResponse,
} from '@/types/common'
import type { WatchlistStatus } from '@/types/watchlist'

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
      const query = buildQueryString({
        offset: params?.offset,
        limit: params?.limit,
        excludeStopped: params?.excludeStopped,
      })
      const url = query ? `${GATEWAY_API_URL}/v1/watchlist/authors?${query}` : `${GATEWAY_API_URL}/v1/watchlist/authors`
      const response = await createRequest(url)

      return await handleResponse<IWatchlistAuthorListResponse>(
        response,
        'Не удалось загрузить список авторов "На карандаше"'
      )
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
      const response = await createRequest(`${GATEWAY_API_URL}/v1/watchlist/authors`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<IWatchlistAuthorResponse>(
        response,
        'Не удалось добавить автора в список "На карандаше"'
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
      const query = buildQueryString({
        offset: params?.offset,
        limit: params?.limit,
      })
      const url = query
        ? `${GATEWAY_API_URL}/v1/watchlist/authors/${id}?${query}`
        : `${GATEWAY_API_URL}/v1/watchlist/authors/${id}`

      const response = await createRequest(url)

      return await handleResponse<IWatchlistAuthorDetailsResponse>(
        response,
        'Не удалось загрузить данные автора "На карандаше"'
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
      const response = await createRequest(`${GATEWAY_API_URL}/v1/watchlist/authors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      return await handleResponse<IWatchlistAuthorResponse>(
        response,
        'Не удалось обновить данные автора'
      )
    } catch (error) {
      toast.error('Не удалось обновить данные автора')
      throw error
    }
  },

  async getSettings(options?: WatchlistRequestOptions): Promise<IWatchlistSettingsResponse> {
    try {
      const response = await createRequest(`${GATEWAY_API_URL}/v1/watchlist/settings`)

      return await handleResponse<IWatchlistSettingsResponse>(
        response,
        'Не удалось загрузить настройки мониторинга авторов'
      )
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
      const response = await createRequest(`${GATEWAY_API_URL}/v1/watchlist/settings`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<IWatchlistSettingsResponse>(
        response,
        'Не удалось обновить настройки мониторинга авторов'
      )
      toast.success('Настройки мониторинга обновлены')
      return result
    } catch (error) {
      toast.error('Не удалось обновить настройки мониторинга авторов')
      throw error
    }
  },
}
