import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { commentsApi } from '@/api/commentsApi'
import { useCommentsStore } from '@/stores'
import { queryKeys } from '@/queries/queryKeys'
import { COMMENTS_PAGE_SIZE, normalizeCommentResponse } from '@/stores/commentsStore.utils'

const fetchInitialComments = async () => {
  const response = await commentsApi.getCommentsCursor({ limit: COMMENTS_PAGE_SIZE })

  return {
    comments: response.items.map((item) => normalizeCommentResponse(item)),
    nextCursor: response.nextCursor ?? null,
    hasMore: response.hasMore,
    totalCount: response.total,
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
