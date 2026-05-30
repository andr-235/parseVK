import { apiClient } from '@/shared/api'
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
  const data = await apiClient.get<GetCommentsDto>(query ? `/v1/comments?${query}` : '/v1/comments')

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
  const data = await apiClient.get<GetCommentsCursorDto>(
    query ? `/v1/comments/cursor?${query}` : '/v1/comments/cursor'
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
  const data = await apiClient.patch<CommentResponseDto>(`/v1/comments/${id}/read`, { isRead })

  return mapComment(data)
}

export const searchComments = async (
  params: CommentsSearchRequestDto
): Promise<CommentsSearchResult> => {
  const data = await apiClient.post<CommentsSearchResponseDto>(
    '/v1/comments/search',
    buildCommentsSearchPayload(params)
  )

  return mapCommentsSearchResult(data)
}
