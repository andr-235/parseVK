import type { ICommentResponse } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const commentsApi = {
  async getComments(): Promise<ICommentResponse[]> {
    const response = await fetch(`${API_URL}/comments`)

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
