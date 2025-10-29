import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { groupsService } from '@/services/groupsService'
import { useGroupsStore } from '@/stores'
import { queryKeys } from '@/queries/queryKeys'

interface UseGroupsQueryOptions {
  enabled?: boolean
}

export const useGroupsQuery = (options?: UseGroupsQueryOptions) => {
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: queryKeys.groups,
    queryFn: groupsService.fetchGroups,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useGroupsStore.setState({ groups: query.data })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const isProcessing = useGroupsStore.getState().isProcessing
    useGroupsStore.setState({ isLoading: query.isFetching || isProcessing })
  }, [enabled, query.isFetching])

  return query
}
