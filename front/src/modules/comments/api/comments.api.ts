import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
import type {
  ICommentResponse,
  IGetCommentsResponse,
  IGetCommentsCursorResponse,
} from '@/shared/types'

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

export const commentsService = {
  async getComments(
    params?: { offset?: number; limit?: number } & CommentsFilters
  ): Promise<IGetCommentsResponse> {
    try {
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
      const response = await createRequest(url)

      return await handleResponse<IGetCommentsResponse>(response, 'Failed to fetch comments')
    } catch (error) {
      toast.error('Не удалось загрузить комментарии')
      throw error
    }
  },

  async getCommentsCursor(
    params?: { cursor?: string; limit?: number } & CommentsFilters
  ): Promise<IGetCommentsCursorResponse> {
    try {
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
      const response = await createRequest(url)

      return await handleResponse<IGetCommentsCursorResponse>(
        response,
        'Failed to fetch comments with cursor'
      )
    } catch (error) {
      toast.error('Не удалось загрузить комментарии')
      throw error
    }
  },

  async updateReadStatus(id: number, isRead: boolean): Promise<ICommentResponse> {
    try {
      const response = await createRequest(`${API_URL}/comments/${id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead }),
      })

      return await handleResponse<ICommentResponse>(
        response,
        'Failed to update comment read status'
      )
    } catch (error) {
      toast.error('Не удалось обновить статус комментария')
      throw error
    }
  },
}
