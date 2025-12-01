import { API_URL } from './config'
import { createRequest, handleResponse } from './utils'
import type { ICommentResponse, IGetCommentsResponse, IGetCommentsCursorResponse } from '../types/api'

type CommentsFilters = {
  keywords?: string[]
  keywordSource?: 'COMMENT' | 'POST'
  readStatus?: 'all' | 'unread' | 'read'
  search?: string
}

const buildFilterQuery = (filters?: CommentsFilters): string => {
  if (!filters) {
    return ''
  }

  const searchParams = new URLSearchParams()

  if (Array.isArray(filters.keywords)) {
    filters.keywords
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .forEach((keyword) => {
        searchParams.append('keywords', keyword)
      })
  }

  if (filters.keywordSource) {
    searchParams.set('keywordSource', filters.keywordSource)
  }

  if (filters.readStatus && filters.readStatus !== 'all') {
    searchParams.set('readStatus', filters.readStatus)
  }

  const normalizedSearch = filters.search?.trim()
  if (normalizedSearch) {
    searchParams.set('search', normalizedSearch)
  }

  return searchParams.toString()
}

export const commentsApi = {
  async getComments(
    params?: { offset?: number; limit?: number } & CommentsFilters,
  ): Promise<IGetCommentsResponse> {
    const searchParams = new URLSearchParams()

    if (typeof params?.offset === 'number') {
      searchParams.set('offset', String(params.offset))
    }

    if (typeof params?.limit === 'number') {
      searchParams.set('limit', String(params.limit))
    }

    const filterQuery = buildFilterQuery(params)
    if (filterQuery) {
      const filterParams = new URLSearchParams(filterQuery)
      for (const [key, value] of filterParams.entries()) {
        searchParams.append(key, value)
      }
    }

    const query = searchParams.toString()
    const url = query ? `${API_URL}/comments?${query}` : `${API_URL}/comments`
    const response = await fetch(url)

    return handleResponse<IGetCommentsResponse>(response, 'Failed to fetch comments')
  },

  /**
   * Cursor-based pagination (рекомендуется для больших списков)
   *
   * Преимущества:
   * - Быстрее на больших offset'ах
   * - Нет проблемы "missing rows" при добавлении новых данных
   */
  async getCommentsCursor(
    params?: { cursor?: string; limit?: number } & CommentsFilters,
  ): Promise<IGetCommentsCursorResponse> {
    const searchParams = new URLSearchParams()

    if (params?.cursor) {
      searchParams.set('cursor', params.cursor)
    }

    if (typeof params?.limit === 'number') {
      searchParams.set('limit', String(params.limit))
    }

    const filterQuery = buildFilterQuery(params)
    if (filterQuery) {
      const filterParams = new URLSearchParams(filterQuery)
      for (const [key, value] of filterParams.entries()) {
        searchParams.append(key, value)
      }
    }

    const query = searchParams.toString()
    const url = query ? `${API_URL}/comments/cursor?${query}` : `${API_URL}/comments/cursor`
    const response = await fetch(url)

    return handleResponse<IGetCommentsCursorResponse>(response, 'Failed to fetch comments with cursor')
  },

  async updateReadStatus(id: number, isRead: boolean): Promise<ICommentResponse> {
    const response = await createRequest(`${API_URL}/comments/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead }),
    })

    return handleResponse<ICommentResponse>(response, 'Failed to update comment read status')
  },
}
