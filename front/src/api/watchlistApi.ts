import type {
  IWatchlistAuthorDetailsResponse,
  IWatchlistAuthorListResponse,
  IWatchlistAuthorResponse,
  IWatchlistSettingsResponse,
  WatchlistStatus,
} from '../types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface ListParams {
  offset?: number
  limit?: number
}

export const watchlistApi = {
  async getAuthors(params?: ListParams): Promise<IWatchlistAuthorListResponse> {
    const searchParams = new URLSearchParams()

    if (typeof params?.offset === 'number') {
      searchParams.set('offset', String(params.offset))
    }

    if (typeof params?.limit === 'number') {
      searchParams.set('limit', String(params.limit))
    }

    const query = searchParams.toString()
    const url = query ? `${API_URL}/watchlist/authors?${query}` : `${API_URL}/watchlist/authors`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Не удалось загрузить список авторов "На карандаше"')
    }

    return response.json()
  },

  async createAuthor(payload: { commentId?: number; authorVkId?: number }): Promise<IWatchlistAuthorResponse> {
    const response = await fetch(`${API_URL}/watchlist/authors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Не удалось добавить автора в список "На карандаше"')
    }

    return response.json()
  },

  async getAuthorDetails(id: number, params?: ListParams): Promise<IWatchlistAuthorDetailsResponse> {
    const searchParams = new URLSearchParams()

    if (typeof params?.offset === 'number') {
      searchParams.set('offset', String(params.offset))
    }

    if (typeof params?.limit === 'number') {
      searchParams.set('limit', String(params.limit))
    }

    const query = searchParams.toString()
    const url = query
      ? `${API_URL}/watchlist/authors/${id}?${query}`
      : `${API_URL}/watchlist/authors/${id}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Не удалось загрузить данные автора "На карандаше"')
    }

    return response.json()
  },

  async updateAuthor(id: number, payload: { status?: WatchlistStatus }): Promise<IWatchlistAuthorResponse> {
    const response = await fetch(`${API_URL}/watchlist/authors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Не удалось обновить данные автора')
    }

    return response.json()
  },

  async getSettings(): Promise<IWatchlistSettingsResponse> {
    const response = await fetch(`${API_URL}/watchlist/settings`)

    if (!response.ok) {
      throw new Error('Не удалось загрузить настройки мониторинга авторов')
    }

    return response.json()
  },

  async updateSettings(payload: Partial<IWatchlistSettingsResponse>): Promise<IWatchlistSettingsResponse> {
    const response = await fetch(`${API_URL}/watchlist/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Не удалось обновить настройки мониторинга авторов')
    }

    return response.json()
  },
}
