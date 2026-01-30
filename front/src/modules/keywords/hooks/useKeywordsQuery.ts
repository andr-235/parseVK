import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { keywordsService } from '@/modules/keywords/api/keywords.api'
import { useKeywordsStore } from '@/store'
import { queryKeys } from '@/hooks/queryKeys'

const fetchKeywords = () => keywordsService.getAllKeywords()

interface UseKeywordsQueryOptions {
  enabled?: boolean
}

export const useKeywordsQuery = (options?: UseKeywordsQueryOptions) => {
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: queryKeys.keywords,
    queryFn: fetchKeywords,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useKeywordsStore.setState({ keywords: query.data })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    useKeywordsStore.setState({ isLoading: query.isFetching })
  }, [enabled, query.isFetching])

  return query
}
