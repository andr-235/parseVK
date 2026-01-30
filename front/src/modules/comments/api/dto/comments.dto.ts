export interface CommentResponseDto {
  id: number
  ownerId?: number | null
  postId?: number | null
  vkCommentId?: number | null
  text?: string | null
  postText?: string | null
  postAttachments?: unknown | null
  postGroup?: unknown | null
  createdAt: string | null
  publishedAt?: string | null
  isRead?: boolean | null
  isDeleted?: boolean | null
  author?: string | Record<string, unknown> | null
  authorName?: string | null
  authorVkId?: number | null
  fromId?: number | null
  watchlistAuthorId?: number | null
  matchedKeywords?: Array<{
    id: number
    word: string
    category?: string | null
    source?: 'POST' | 'COMMENT' | string
  }> | null
}

export interface GetCommentsDto {
  items: CommentResponseDto[]
  total: number
  hasMore: boolean
  readCount: number
  unreadCount: number
}

export interface GetCommentsCursorDto {
  items: CommentResponseDto[]
  nextCursor: string | null
  hasMore: boolean
  total: number
  readCount: number
  unreadCount: number
}
