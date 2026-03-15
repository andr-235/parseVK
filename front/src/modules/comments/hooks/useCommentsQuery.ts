import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

// Использование API функций напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { getCommentsCursor } from '@/modules/comments/api/comments.api'
import type { CommentsFilters } from '@/modules/comments/api/query/commentsQuery.types'
import { commentsQueryKeys } from '@/modules/comments/api/queryKeys'
import { useCommentsStore } from '@/modules/comments/store'
import { COMMENTS_PAGE_SIZE } from '@/modules/comments/store'
import type { CommentsQueryData } from '@/modules/comments/types/commentsCache.types'

const buildFetchParams = (filters: CommentsFilters) => ({
  limit: COMMENTS_PAGE_SIZE,
  keywords: filters.keywords,
  keywordSource: filters.keywordSource,
  readStatus: filters.readStatus,
  search: filters.search,
})

const fetchInitialComments = async (filters: CommentsFilters): Promise<CommentsQueryData> => {
  const response = await getCommentsCursor(buildFetchParams(filters))

  return {
    comments: Array.isArray(response.items) ? response.items : [],
    nextCursor: response.nextCursor ?? null,
    hasMore: response.hasMore,
    totalCount: response.total,
    readCount: response.readCount,
    unreadCount: response.unreadCount,
    filters,
  }
}

export const mergeCommentsSyncData = (
  incoming: CommentsQueryData,
  existing: Pick<
    ReturnType<typeof useCommentsStore.getState>,
    'comments' | 'nextCursor' | 'hasMore' | 'totalCount' | 'readCount' | 'unreadCount'
  >
) => {
  const incomingIds = new Set(incoming.comments.map((comment) => comment.id))
  const extras = existing.comments.filter((comment) => !incomingIds.has(comment.id))
  const mergedComments = [...incoming.comments, ...extras]
  const hasLoadedExtraPages = extras.length > 0
  const allLoaded = mergedComments.length >= incoming.totalCount

  return {
    comments: mergedComments,
    totalCount: incoming.totalCount,
    readCount: incoming.readCount,
    unreadCount: incoming.unreadCount,
    hasMore: allLoaded ? false : hasLoadedExtraPages ? existing.hasMore : incoming.hasMore,
    nextCursor: allLoaded ? null : hasLoadedExtraPages ? existing.nextCursor : incoming.nextCursor,
  }
}

const applyQueryDataToStore = (data: CommentsQueryData) => {
  useCommentsStore.setState((state) => {
    const merged = mergeCommentsSyncData(data, state)

    return {
      comments: merged.comments,
      totalCount: merged.totalCount,
      hasMore: merged.hasMore,
      nextCursor: merged.nextCursor,
      readCount: merged.readCount,
      unreadCount: merged.unreadCount,
      filters: data.filters,
      isLoading: false,
      isLoadingMore: false,
    }
  })
}

export const shouldNotifyCommentsSyncError = (enabled: boolean, hasError: boolean, hasComments: boolean) => {
  return enabled && hasError && !hasComments
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

    applyQueryDataToStore(query.data)
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

  useEffect(() => {
    const hasComments = useCommentsStore.getState().comments.length > 0
    if (!shouldNotifyCommentsSyncError(enabled, Boolean(query.error), hasComments)) {
      return
    }

    console.error('Failed to sync comments', query.error)
    toast.error('Не удалось загрузить комментарии')
  }, [enabled, query.error])

  return query
}
