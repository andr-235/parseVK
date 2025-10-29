import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { realEstateService } from '@/services/realEstateService'
import { useRealEstateStore } from '@/stores'
import { queryKeys } from '@/queries/queryKeys'
import type { RealEstateFilters } from '@/types/realEstate'

const createFetchListings =
  (filters: RealEstateFilters) => () => realEstateService.fetchListings(filters)

interface UseRealEstateQueryOptions {
  enabled?: boolean
}

export const useRealEstateQuery = (options?: UseRealEstateQueryOptions) => {
  const enabled = options?.enabled ?? true
  const filters = useRealEstateStore((state) => state.filters)

  const queryKey = useMemo(() => queryKeys.realEstate(filters), [filters])

  const query = useQuery({
    queryKey,
    queryFn: createFetchListings(filters),
    staleTime: 60_000,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useRealEstateStore.setState({
      listings: query.data.items,
      summary: query.data.summary ?? null,
      lastGeneratedAt: query.data.generatedAt ?? null,
    })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    useRealEstateStore.setState({ isLoading: query.isFetching })
  }, [enabled, query.isFetching])

  return query
}
