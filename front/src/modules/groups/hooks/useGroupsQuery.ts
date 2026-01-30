import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { groupsService } from '@/modules/groups/api/groups.api'
import { groupsQueryKeys } from '@/modules/groups/api/queryKeys'
import { GROUPS_PAGE_LIMIT, useGroupsStore } from '@/modules/groups/store'

interface UseGroupsQueryOptions {
  enabled?: boolean
}

const fetchGroups = () => groupsService.fetchGroups({ page: 1, limit: GROUPS_PAGE_LIMIT })

export const useGroupsQuery = (options?: UseGroupsQueryOptions) => {
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: groupsQueryKeys.list(),
    queryFn: fetchGroups,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useGroupsStore.setState({
      groups: query.data.items,
      total: query.data.total,
      page: query.data.page,
      limit: query.data.limit,
      hasMore: query.data.hasMore,
    })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const { isProcessing } = useGroupsStore.getState()
    useGroupsStore.setState({
      isLoading: query.isFetching || isProcessing,
      isLoadingMore: query.isFetching ? useGroupsStore.getState().isLoadingMore : false,
    })
  }, [enabled, query.isFetching])

  return query
}
