import { API_URL, createRequest, handleResponse } from '@/shared/api'
import type { CommentsFilters } from './query/commentsQuery.types'
import type { CommentResponseDto, GetCommentsCursorDto, GetCommentsDto } from './dto/comments.dto'
import type { CommentsSearchRequestDto, CommentsSearchResponseDto } from './dto/commentsSearch.dto'
import type { Comment } from './models/comment.model'
import type { CommentsSearchResult } from './models/commentsSearch.model'
import { buildCommentsQuery } from './query/buildCommentsQuery'
import { buildCommentsSearchPayload } from './query/buildCommentsSearchQuery'
import { mapComment, mapComments } from './mappers/mapComment'
import { mapCommentsSearchResult } from './mappers/mapCommentsSearchResult'

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
  const data = await handleResponse<GetCommentsDto>(response, 'Failed to fetch comments')

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
  const data = await handleResponse<GetCommentsCursorDto>(
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

  const data = await handleResponse<CommentResponseDto>(
    response,
    'Failed to update comment read status'
  )

  return mapComment(data)
}

export const searchComments = async (
  params: CommentsSearchRequestDto
): Promise<CommentsSearchResult> => {
  const response = await createRequest(`${API_URL}/comments/search`, {
    method: 'POST',
    body: JSON.stringify(buildCommentsSearchPayload(params)),
  })

  const data = await handleResponse<CommentsSearchResponseDto>(
    response,
    'Failed to search comments'
  )

  return mapCommentsSearchResult(data)
}
