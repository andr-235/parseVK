import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { groupsService } from '@/services/groupsService'
import { GROUPS_PAGE_LIMIT, useGroupsStore } from '@/stores'
import { queryKeys } from '@/queries/queryKeys'

interface UseGroupsQueryOptions {
  enabled?: boolean
}

export const useGroupsQuery = (options?: UseGroupsQueryOptions) => {
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: queryKeys.groups,
    queryFn: () => groupsService.fetchGroups({ page: 1, limit: GROUPS_PAGE_LIMIT }),
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
