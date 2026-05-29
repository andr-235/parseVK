import type { PostGroup } from '@/shared/types/common'
import type { Keyword } from '@/shared/types/common'

export interface Comment {
  id: number
  author: string
  authorId: string | null
  authorUrl: string | null
  authorAvatar: string | null
  commentUrl: string | null
  text: string
  postText: string | null
  postAttachments: unknown | null
  postGroup: PostGroup | null
  createdAt: string
  publishedAt: string | null
  isRead: boolean
  isDeleted: boolean
  watchlistAuthorId: number | null
  isWatchlisted: boolean
  matchedKeywords: Keyword[]
}
