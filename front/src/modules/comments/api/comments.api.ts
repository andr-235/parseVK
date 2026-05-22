import { API_URL, GATEWAY_API_URL, createRequest, handleResponse } from '@/shared/api'
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

type ContentPageDto<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

type ContentCommentDto = {
  id: number
  vkOwnerId?: number | null
  vkPostId?: number | null
  vkCommentId?: number | null
  authorVkId?: number | null
  date?: string | null
  text?: string | null
}

const CONTENT_COMMENTS_API_URL = `${GATEWAY_API_URL}/v1/content/comments`

const hasLegacyOnlyFilters = (params?: CommentsFilters): boolean =>
  Boolean(
    params?.keywords?.length ||
      params?.keywordSource ||
      (params?.readStatus && params.readStatus !== 'all') ||
      params?.search?.trim()
  )

const offsetToPage = (offset = 0, limit = 20): number => Math.floor(offset / limit) + 1

const contentCommentsUrl = (page: number, limit: number): string =>
  `${CONTENT_COMMENTS_API_URL}?page=${page}&limit=${limit}`

const mapContentComment = (comment: ContentCommentDto): CommentResponseDto => ({
  id: comment.id,
  ownerId: comment.vkOwnerId ?? null,
  postId: comment.vkPostId ?? null,
  vkCommentId: comment.vkCommentId ?? null,
  fromId: comment.authorVkId ?? null,
  authorVkId: comment.authorVkId ?? null,
  text: comment.text ?? '',
  createdAt: comment.date ?? null,
  publishedAt: comment.date ?? null,
})

export const getComments = async (
  params?: { offset?: number; limit?: number } & CommentsFilters
): Promise<GetCommentsResult> => {
  if (!hasLegacyOnlyFilters(params)) {
    const limit = params?.limit ?? 20
    const page = offsetToPage(params?.offset, limit)
    const response = await createRequest(contentCommentsUrl(page, limit))
    const data = await handleResponse<ContentPageDto<ContentCommentDto>>(
      response,
      'Failed to fetch comments'
    )

    return {
      items: mapComments(data.items.map(mapContentComment)),
      total: data.total,
      hasMore: data.hasMore,
      readCount: 0,
      unreadCount: data.total,
    }
  }

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
  if (!hasLegacyOnlyFilters(params)) {
    const limit = params?.limit ?? 20
    const page = params?.cursor ? Number.parseInt(params.cursor, 10) || 1 : 1
    const response = await createRequest(contentCommentsUrl(page, limit))
    const data = await handleResponse<ContentPageDto<ContentCommentDto>>(
      response,
      'Failed to fetch comments with cursor'
    )

    return {
      items: mapComments(data.items.map(mapContentComment)),
      nextCursor: data.hasMore ? String(data.page + 1) : null,
      hasMore: data.hasMore,
      total: data.total,
      readCount: 0,
      unreadCount: data.total,
    }
  }

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
