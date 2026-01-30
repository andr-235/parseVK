import { API_URL, createRequest, handleResponse } from '@/shared/api'
import type {
  Comment,
  CommentsFilters,
  ICommentResponse,
  IGetCommentsCursorResponse,
  IGetCommentsResponse,
} from '@/shared/types'
import { buildCommentsQuery } from './buildCommentsQuery'
import { mapComment, mapComments } from './mappers/mapComment'

type GetCommentsResult = {
  items: Comment[]
  total: number
  hasMore: boolean
  readCount: number
  unreadCount: number
}

type GetCommentsCursorResult = {
  items: Comment[]
  nextCursor: string | null
  hasMore: boolean
  total: number
  readCount: number
  unreadCount: number
}

export const getComments = async (
  params?: { offset?: number; limit?: number } & CommentsFilters
): Promise<GetCommentsResult> => {
  const query = buildCommentsQuery(params)
  const url = query ? `${API_URL}/comments?${query}` : `${API_URL}/comments`
  const response = await createRequest(url)
  const data = await handleResponse<IGetCommentsResponse>(response, 'Failed to fetch comments')

  return {
    items: mapComments(data.items),
    total: data.total,
    hasMore: data.hasMore,
    readCount: data.readCount,
    unreadCount: data.unreadCount,
  }
}

export const getCommentsCursor = async (
  params?: { cursor?: string; limit?: number } & CommentsFilters
): Promise<GetCommentsCursorResult> => {
  const query = buildCommentsQuery(params)
  const url = query ? `${API_URL}/comments/cursor?${query}` : `${API_URL}/comments/cursor`
  const response = await createRequest(url)
  const data = await handleResponse<IGetCommentsCursorResponse>(
    response,
    'Failed to fetch comments with cursor'
  )

  return {
    items: mapComments(data.items),
    nextCursor: data.nextCursor ?? null,
    hasMore: data.hasMore,
    total: data.total,
    readCount: data.readCount,
    unreadCount: data.unreadCount,
  }
}

export const updateReadStatus = async (id: number, isRead: boolean): Promise<Comment> => {
  const response = await createRequest(`${API_URL}/comments/${id}/read`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead }),
  })

  const data = await handleResponse<ICommentResponse>(
    response,
    'Failed to update comment read status'
  )

  return mapComment(data)
}
