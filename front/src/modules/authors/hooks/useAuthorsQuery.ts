import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { authorsService } from '@/services/authorsService'
import { useAuthorsStore } from '@/store'
import { queryKeys, type AuthorsQueryParams } from '@/hooks/queryKeys'

const createFetchAuthors = (params: AuthorsQueryParams) => () => {
  return authorsService.fetchAuthors({
    offset: 0,
    limit: params.pageSize,
    search: params.search || undefined,
    verified:
      params.status === 'all'
        ? undefined
        : params.status === 'verified',
    sortBy: params.sortBy ?? undefined,
    sortOrder: params.sortBy ? params.sortOrder : undefined,
  })
}

export const useAuthorsQuery = (enabled: boolean) => {
  const statusFilter = useAuthorsStore((state) => state.statusFilter)
  const rawSearch = useAuthorsStore((state) => state.search)
  const sortBy = useAuthorsStore((state) => state.sortBy)
  const sortOrder = useAuthorsStore((state) => state.sortOrder)
  const pageSize = useAuthorsStore((state) => state.pageSize)

  const params = useMemo<AuthorsQueryParams>(() => ({
    status: statusFilter,
    search: rawSearch.trim(),
    sortBy,
    sortOrder: sortBy ? sortOrder : 'desc',
    pageSize,
  }), [statusFilter, rawSearch, sortBy, sortOrder, pageSize])

  const queryKey = useMemo(() => queryKeys.authors.list(params), [params])

  const query = useQuery({
    queryKey,
    queryFn: createFetchAuthors(params),
    staleTime: 60_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useAuthorsStore.setState((state) => {
      const incoming = query.data.items
      const existing = state.authors
      const incomingIds = new Set(incoming.map((item) => item.id))
      const extras = existing.filter((item) => !incomingIds.has(item.id))

      return {
        ...state,
        authors: [...incoming, ...extras],
        total: query.data.total,
        hasMore: query.data.hasMore,
        isLoading: false,
        isLoadingMore: false,
      }
    })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const hasData = useAuthorsStore.getState().authors.length > 0
    const shouldShowLoading = query.isFetching && !hasData

    useAuthorsStore.setState((state) => ({
      ...state,
      isLoading: shouldShowLoading,
    }))
  }, [enabled, query.isFetching])

  return query
}
