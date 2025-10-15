import { API_URL } from './config'
import type { AuthorsListResponse } from '../types/api'

const buildQuery = (params: Record<string, string>): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export const authorsApi = {
  async fetchAuthors(params: {
    offset?: number
    limit?: number
    search?: string
  } = {}): Promise<AuthorsListResponse> {
    const queryParams: Record<string, string> = {}

    if (typeof params.offset === 'number' && params.offset > 0) {
      queryParams.offset = String(params.offset)
    }

    if (typeof params.limit === 'number' && params.limit > 0) {
      queryParams.limit = String(params.limit)
    }

    if (params.search && params.search.trim()) {
      queryParams.search = params.search.trim()
    }

    const response = await fetch(`${API_URL}/authors${buildQuery(queryParams)}`)
    if (!response.ok) {
      throw new Error('Failed to fetch authors')
    }

    return response.json()
  },

  async refreshAuthors(): Promise<{ updated: number }> {
    const response = await fetch(`${API_URL}/authors/refresh`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to refresh authors')
    }

    return response.json()
  }
}
