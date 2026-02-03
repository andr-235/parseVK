import type { CommentsFilters } from '@/modules/comments/api/query/commentsQuery.types'
import type { Comment } from '@/modules/comments/api/models/comment.model'

/**
 * Структура данных для кеширования комментариев в React Query
 *
 * ВАЖНО: Этот тип используется в обоих местах:
 * - useCommentsQuery (управление кешем через React Query)
 * - commentsStore (обновление кеша при мутациях)
 *
 * Любые изменения должны быть согласованы между обоими использованиями!
 */
export type CommentsQueryData = {
  comments: Comment[]
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
  readCount: number
  unreadCount: number
  filters: CommentsFilters
}
