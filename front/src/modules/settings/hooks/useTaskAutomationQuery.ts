import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { taskAutomationService } from '@/modules/settings/api/taskAutomation.api'
import { settingsQueryKeys } from '@/modules/settings/api/queryKeys'
import { useTaskAutomationStore } from '@/modules/settings/store'

interface UseTaskAutomationQueryOptions {
  enabled?: boolean
}

export const useTaskAutomationQuery = (options?: UseTaskAutomationQueryOptions) => {
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: settingsQueryKeys.taskAutomation(),
    queryFn: taskAutomationService.fetchSettings,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useTaskAutomationStore.setState({ settings: query.data })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      useTaskAutomationStore.setState({ isLoading: false })
      return
    }

    useTaskAutomationStore.setState({ isLoading: query.isFetching })
  }, [enabled, query.isFetching])

  return query
}
