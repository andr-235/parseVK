import type { CommentResponseDto } from '../dto/comments.dto'
import type { Comment } from '../models/comment.model'
import type { PostGroup } from '@/shared/types/common'
import { buildCommentUrl, normalizeCreatedAt, resolveAuthorInfo } from './commentMapping.utils'

const isValidPostGroup = (value: unknown): value is PostGroup => {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'number' &&
    typeof obj.vkId === 'number' &&
    typeof obj.name === 'string' &&
    (obj.screenName === null || typeof obj.screenName === 'string') &&
    (obj.photo === null || typeof obj.photo === 'string')
  )
}

export const mapComment = (comment: CommentResponseDto): Comment => {
  const authorInfo = resolveAuthorInfo(comment)
  const watchlistAuthorId =
    typeof comment.watchlistAuthorId === 'number' ? comment.watchlistAuthorId : null
  const matchedKeywords = Array.isArray(comment.matchedKeywords)
    ? comment.matchedKeywords
        .map((keyword) => {
          const source: 'POST' | 'COMMENT' | undefined =
            keyword.source === 'POST' || keyword.source === 'COMMENT' ? keyword.source : undefined

          return {
            id: keyword.id,
            word: keyword.word,
            category: keyword.category ?? null,
            source,
          }
        })
        .filter((keyword) => typeof keyword.id === 'number' && Boolean(keyword.word))
    : []

  return {
    id: comment.id,
    author: authorInfo.name,
    authorId: authorInfo.id,
    authorUrl: authorInfo.url,
    authorAvatar: authorInfo.avatar,
    commentUrl: buildCommentUrl(comment),
    text: comment.text ?? '',
    postText: comment.postText ?? null,
    postAttachments: comment.postAttachments ?? null,
    postGroup: isValidPostGroup(comment.postGroup) ? comment.postGroup : null,
    createdAt: normalizeCreatedAt(comment.createdAt),
    publishedAt: comment.publishedAt ? normalizeCreatedAt(comment.publishedAt) : null,
    isRead: comment.isRead ?? false,
    isDeleted: comment.isDeleted ?? false,
    watchlistAuthorId,
    isWatchlisted: Boolean(watchlistAuthorId),
    matchedKeywords,
  }
}

export const mapComments = (comments: CommentResponseDto[]): Comment[] => comments.map(mapComment)
