import { API_URL } from './config'
import { buildQueryString, createRequest, handleResponse } from './utils'
import type {
  IWatchlistAuthorDetailsResponse,
  IWatchlistAuthorListResponse,
  IWatchlistAuthorResponse,
  IWatchlistSettingsResponse,
  WatchlistStatus,
} from '../types/api'

interface ListParams {
  offset?: number
  limit?: number
  excludeStopped?: boolean
}

export const watchlistApi = {
  async getAuthors(params?: ListParams): Promise<IWatchlistAuthorListResponse> {
    const query = buildQueryString({
      offset: params?.offset,
      limit: params?.limit,
      excludeStopped: params?.excludeStopped,
    })
    const url = query ? `${API_URL}/watchlist/authors?${query}` : `${API_URL}/watchlist/authors`
    const response = await fetch(url)

    return handleResponse<IWatchlistAuthorListResponse>(
      response,
      'Не удалось загрузить список авторов "На карандаше"',
    )
  },

  async createAuthor(payload: {
    commentId?: number
    authorVkId?: number
  }): Promise<IWatchlistAuthorResponse> {
    const response = await createRequest(`${API_URL}/watchlist/authors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return handleResponse<IWatchlistAuthorResponse>(
      response,
      'Не удалось добавить автора в список "На карандаше"',
    )
  },

  async getAuthorDetails(
    id: number,
    params?: ListParams,
  ): Promise<IWatchlistAuthorDetailsResponse> {
    const query = buildQueryString({
      offset: params?.offset,
      limit: params?.limit,
    })
    const url = query
      ? `${API_URL}/watchlist/authors/${id}?${query}`
      : `${API_URL}/watchlist/authors/${id}`

    const response = await fetch(url)

    return handleResponse<IWatchlistAuthorDetailsResponse>(
      response,
      'Не удалось загрузить данные автора "На карандаше"',
    )
  },

  async updateAuthor(
    id: number,
    payload: { status?: WatchlistStatus },
  ): Promise<IWatchlistAuthorResponse> {
    const response = await createRequest(`${API_URL}/watchlist/authors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return handleResponse<IWatchlistAuthorResponse>(response, 'Не удалось обновить данные автора')
  },

  async getSettings(): Promise<IWatchlistSettingsResponse> {
    const response = await fetch(`${API_URL}/watchlist/settings`)

    return handleResponse<IWatchlistSettingsResponse>(
      response,
      'Не удалось загрузить настройки мониторинга авторов',
    )
  },

  async updateSettings(
    payload: Partial<IWatchlistSettingsResponse>,
  ): Promise<IWatchlistSettingsResponse> {
    const response = await createRequest(`${API_URL}/watchlist/settings`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return handleResponse<IWatchlistSettingsResponse>(
      response,
      'Не удалось обновить настройки мониторинга авторов',
    )
  },
}
