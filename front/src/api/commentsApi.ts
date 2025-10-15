import { API_URL } from './config'
import type { ICommentResponse, IGetCommentsResponse, IGetCommentsCursorResponse } from '../types/api'

export const commentsApi = {
  async getComments(params?: { offset?: number; limit?: number }): Promise<IGetCommentsResponse> {
    const searchParams = new URLSearchParams()

    if (typeof params?.offset === 'number') {
      searchParams.set('offset', String(params.offset))
    }

    if (typeof params?.limit === 'number') {
      searchParams.set('limit', String(params.limit))
    }

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
  async getCommentsCursor(params?: { cursor?: string; limit?: number }): Promise<IGetCommentsCursorResponse> {
    const searchParams = new URLSearchParams()

    if (params?.cursor) {
      searchParams.set('cursor', params.cursor)
    }

    if (typeof params?.limit === 'number') {
      searchParams.set('limit', String(params.limit))
    }

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
