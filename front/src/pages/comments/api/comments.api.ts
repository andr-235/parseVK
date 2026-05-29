import { GATEWAY_API_URL, createRequest, handleResponse } from '@/api/common'
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
  const url = query ? `${GATEWAY_API_URL}/v1/comments?${query}` : `${GATEWAY_API_URL}/v1/comments`
  const response = await createRequest(url)
  const data = await handleResponse<GetCommentsDto>(response, 'Failed to fetch comments')

  return {
    items: mapComments(data.items),
    total: data.total,
    hasMore: data.hasMore,
    readCount: data.readCount ?? 0,
    unreadCount: data.unreadCount ?? data.total,
  }
}

export const getCommentsCursor = async (
  params?: { cursor?: string; limit?: number } & CommentsFilters
): Promise<GetCommentsCursorResult> => {
  const query = buildCommentsQuery(params)
  const url = query
    ? `${GATEWAY_API_URL}/v1/comments/cursor?${query}`
    : `${GATEWAY_API_URL}/v1/comments/cursor`
  const response = await createRequest(url)
  const data = await handleResponse<GetCommentsCursorDto>(
    response,
    'Failed to fetch comments with cursor'
  )

  return {
    items: mapComments(data.items),
    nextCursor: data.nextCursor ?? null,
    hasMore: data.hasMore ?? data.nextCursor !== null,
    total: data.total ?? data.items.length,
    readCount: data.readCount ?? 0,
    unreadCount: data.unreadCount ?? data.total ?? data.items.length,
  }
}

export const updateReadStatus = async (id: number, isRead: boolean): Promise<Comment> => {
  const response = await createRequest(`${GATEWAY_API_URL}/v1/comments/${id}/read`, {
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
  const response = await createRequest(`${GATEWAY_API_URL}/v1/comments/search`, {
    method: 'POST',
    body: JSON.stringify(buildCommentsSearchPayload(params)),
  })

  const data = await handleResponse<CommentsSearchResponseDto>(
    response,
    'Failed to search comments'
  )

  return mapCommentsSearchResult(data)
}
