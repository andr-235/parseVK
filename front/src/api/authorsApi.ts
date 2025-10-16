import { API_URL } from './config'
import type {
  AuthorDetailsResponse,
  AuthorsListResponse,
  RefreshAuthorsResponse,
} from '../types/api'

export const authorsApi = {
  async fetchAuthors(params: {
    offset?: number
    limit?: number
    search?: string
  } = {}): Promise<AuthorsListResponse> {
    const searchParams = new URLSearchParams()

    if (typeof params.offset === 'number') {
      searchParams.set('offset', String(params.offset))
    }

    if (typeof params.limit === 'number') {
      searchParams.set('limit', String(params.limit))
    }

    if (params.search) {
      searchParams.set('search', params.search)
    }

    const query = searchParams.toString()
    const url = query ? `${API_URL}/authors?${query}` : `${API_URL}/authors`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Не удалось загрузить список авторов')
    }

    return response.json()
  },

  async getDetails(vkUserId: number): Promise<AuthorDetailsResponse> {
    const response = await fetch(`${API_URL}/authors/${vkUserId}`)

    if (!response.ok) {
      throw new Error('Не удалось загрузить данные пользователя')
    }

    return response.json()
  },

  async refreshAuthors(): Promise<RefreshAuthorsResponse> {
    const response = await fetch(`${API_URL}/authors/refresh`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Не удалось обновить карточки авторов')
    }

    return response.json()
  },
}
