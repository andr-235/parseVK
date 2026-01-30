import type { CommentsFilters } from '@/shared/types'

export const commentsQueryKeys = {
  all: ['comments'] as const,
  list: (filters: CommentsFilters) => [...commentsQueryKeys.all, 'list', filters] as const,
  byId: (id: number | string) => [...commentsQueryKeys.all, 'byId', id] as const,
  thread: (postId: number | string) => [...commentsQueryKeys.all, 'thread', postId] as const,
} as const
