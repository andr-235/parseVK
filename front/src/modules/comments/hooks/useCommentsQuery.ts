import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { commentsService } from '@/modules/comments/api/comments.api'
import { commentsQueryKeys } from '@/modules/comments/api/queryKeys'
import { useCommentsStore } from '@/store'
import { COMMENTS_PAGE_SIZE, normalizeCommentResponse } from '@/store/comments/commentsStore.utils'
import type { CommentsFilters } from '@/shared/types'

const fetchInitialComments = async (filters: CommentsFilters) => {
  const response = await commentsService.getCommentsCursor({
    limit: COMMENTS_PAGE_SIZE,
    keywords: filters.keywords,
    keywordSource: filters.keywordSource,
    readStatus: filters.readStatus,
    search: filters.search,
  })

  return {
    comments: Array.isArray(response.items)
      ? response.items.map((item) => normalizeCommentResponse(item))
      : [],
    nextCursor: response.nextCursor ?? null,
    hasMore: response.hasMore,
    totalCount: response.total,
    readCount: response.readCount,
    unreadCount: response.unreadCount,
    filters,
  }
}

interface UseCommentsQueryOptions {
  enabled?: boolean
}

export const useCommentsQuery = (options?: UseCommentsQueryOptions) => {
  const enabled = options?.enabled ?? true
  const filters = useCommentsStore((state) => state.filters)

  const query = useQuery({
    queryKey: commentsQueryKeys.list(filters),
    queryFn: () => fetchInitialComments(filters),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useCommentsStore.setState({
      comments: query.data.comments,
      totalCount: query.data.totalCount,
      hasMore: query.data.hasMore,
      nextCursor: query.data.nextCursor,
      readCount: query.data.readCount,
      unreadCount: query.data.unreadCount,
      filters: query.data.filters,
      isLoading: false,
      isLoadingMore: false,
    })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const hasComments = useCommentsStore.getState().comments.length > 0
    const shouldShowLoading = query.isFetching && !hasComments

    useCommentsStore.setState({
      isLoading: shouldShowLoading,
    })
  }, [enabled, query.isFetching])

  return query
}
