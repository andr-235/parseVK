import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { commentsApi } from '@/api/commentsApi'
import { useCommentsStore } from '@/stores'
import { queryKeys } from '@/queries/queryKeys'
import { COMMENTS_PAGE_SIZE, normalizeCommentResponse } from '@/stores/commentsStore.utils'

const fetchInitialComments = async () => {
  const { filters } = useCommentsStore.getState()
  const response = await commentsApi.getCommentsCursor({
    limit: COMMENTS_PAGE_SIZE,
    keywords: filters.keywords,
    keywordSource: filters.keywordSource,
    readStatus: filters.readStatus,
    search: filters.search,
  })

  return {
    comments: response.items.map((item) => normalizeCommentResponse(item)),
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

  const query = useQuery({
    queryKey: queryKeys.comments,
    queryFn: fetchInitialComments,
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
