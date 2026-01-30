import type { CommentResponseDto } from '../dto/comments.dto'
import type { Comment } from '../models/comment.model'
import { buildCommentUrl, normalizeCreatedAt, resolveAuthorInfo } from './commentMapping.utils'

export const mapComment = (comment: CommentResponseDto): Comment => {
  const authorInfo = resolveAuthorInfo(comment)
  const watchlistAuthorId =
    typeof comment.watchlistAuthorId === 'number' ? comment.watchlistAuthorId : null
  const matchedKeywords = Array.isArray(comment.matchedKeywords)
    ? comment.matchedKeywords
        .map((keyword) => ({
          id: keyword.id,
          word: keyword.word,
          category: keyword.category ?? null,
          source:
            keyword.source === 'POST' || keyword.source === 'COMMENT' ? keyword.source : undefined,
        }))
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
    postGroup: comment.postGroup ?? null,
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
