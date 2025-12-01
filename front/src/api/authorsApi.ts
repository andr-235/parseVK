import { API_URL } from './config'
import { buildQueryString, handleResponse } from './utils'
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
    verified?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<AuthorsListResponse> {
    const query = buildQueryString({
      offset: params.offset,
      limit: params.limit,
      search: params.search,
      verified: params.verified,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    })
    const url = query ? `${API_URL}/authors?${query}` : `${API_URL}/authors`
    const response = await fetch(url)

    return handleResponse<AuthorsListResponse>(response, 'Не удалось загрузить список авторов')
  },

  async getDetails(vkUserId: number): Promise<AuthorDetailsResponse> {
    const response = await fetch(`${API_URL}/authors/${vkUserId}`)

    return handleResponse<AuthorDetailsResponse>(response, 'Не удалось загрузить данные пользователя')
  },

  async refreshAuthors(): Promise<RefreshAuthorsResponse> {
    const response = await fetch(`${API_URL}/authors/refresh`, {
      method: 'POST',
    })

    return handleResponse<RefreshAuthorsResponse>(response, 'Не удалось обновить карточки авторов')
  },
}
