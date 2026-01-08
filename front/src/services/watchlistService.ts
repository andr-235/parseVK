import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { buildQueryString, createRequest, handleResponse } from '@/lib/apiUtils'
import type {
  IWatchlistAuthorDetailsResponse,
  IWatchlistAuthorListResponse,
  IWatchlistAuthorResponse,
  IWatchlistSettingsResponse,
  WatchlistStatus,
} from '@/types/api'

interface ListParams {
  offset?: number
  limit?: number
  excludeStopped?: boolean
}

export const watchlistService = {
  async getAuthors(params?: ListParams): Promise<IWatchlistAuthorListResponse> {
    try {
      const query = buildQueryString({
        offset: params?.offset,
        limit: params?.limit,
        excludeStopped: params?.excludeStopped,
      })
      const url = query ? `${API_URL}/watchlist/authors?${query}` : `${API_URL}/watchlist/authors`
      const response = await createRequest(url)

      return await handleResponse<IWatchlistAuthorListResponse>(
        response,
        'Не удалось загрузить список авторов "На карандаше"'
      )
    } catch (error) {
      toast.error('Не удалось загрузить список авторов "На карандаше"')
      throw error
    }
  },

  async createAuthor(payload: {
    commentId?: number
    authorVkId?: number
  }): Promise<IWatchlistAuthorResponse> {
    try {
      const response = await createRequest(`${API_URL}/watchlist/authors`, {
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
    params?: ListParams
  ): Promise<IWatchlistAuthorDetailsResponse> {
    try {
      const query = buildQueryString({
        offset: params?.offset,
        limit: params?.limit,
      })
      const url = query
        ? `${API_URL}/watchlist/authors/${id}?${query}`
        : `${API_URL}/watchlist/authors/${id}`

      const response = await createRequest(url)

      return await handleResponse<IWatchlistAuthorDetailsResponse>(
        response,
        'Не удалось загрузить данные автора "На карандаше"'
      )
    } catch (error) {
      toast.error('Не удалось загрузить данные автора "На карандаше"')
      throw error
    }
  },

  async updateAuthor(
    id: number,
    payload: { status?: WatchlistStatus }
  ): Promise<IWatchlistAuthorResponse> {
    try {
      const response = await createRequest(`${API_URL}/watchlist/authors/${id}`, {
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

  async getSettings(): Promise<IWatchlistSettingsResponse> {
    try {
      const response = await createRequest(`${API_URL}/watchlist/settings`)

      return await handleResponse<IWatchlistSettingsResponse>(
        response,
        'Не удалось загрузить настройки мониторинга авторов'
      )
    } catch (error) {
      toast.error('Не удалось загрузить настройки мониторинга авторов')
      throw error
    }
  },

  async updateSettings(
    payload: Partial<IWatchlistSettingsResponse>
  ): Promise<IWatchlistSettingsResponse> {
    try {
      const response = await createRequest(`${API_URL}/watchlist/settings`, {
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
