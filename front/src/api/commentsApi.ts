import type { ICommentResponse, IGetCommentsResponse } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
