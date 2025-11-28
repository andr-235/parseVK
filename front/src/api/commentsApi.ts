import { API_URL } from './config'
import type { ICommentResponse, IGetCommentsResponse, IGetCommentsCursorResponse } from '../types/api'

type CommentsFilters = {
  keywords?: string[]
  keywordSource?: 'COMMENT' | 'POST'
  readStatus?: 'all' | 'unread' | 'read'
  search?: string
}

const appendFilterParams = (searchParams: URLSearchParams, filters?: CommentsFilters) => {
  if (!filters) {
    return
  }

  const { keywords, keywordSource, readStatus, search } = filters

  if (Array.isArray(keywords)) {
    keywords
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .forEach((keyword) => {
        searchParams.append('keywords', keyword)
      })
  }

  if (keywordSource) {
    searchParams.set('keywordSource', keywordSource)
  }

  if (readStatus && readStatus !== 'all') {
    searchParams.set('readStatus', readStatus)
  }

  const normalizedSearch = search?.trim()
  if (normalizedSearch) {
    searchParams.set('search', normalizedSearch)
  }
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

    appendFilterParams(searchParams, params)

    const query = searchParams.toString()
    const url = query ? `${API_URL}/comments?${query}` : `${API_URL}/comments`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }

    return response.json()
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

    appendFilterParams(searchParams, params)

    const query = searchParams.toString()
    const url = query ? `${API_URL}/comments/cursor?${query}` : `${API_URL}/comments/cursor`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch comments with cursor')
    }

    return response.json()
  },

  async updateReadStatus(id: number, isRead: boolean): Promise<ICommentResponse> {
    const response = await fetch(`${API_URL}/comments/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead }),
    })

    if (!response.ok) {
      throw new Error('Failed to update comment read status')
    }

    return response.json()
  }
}
