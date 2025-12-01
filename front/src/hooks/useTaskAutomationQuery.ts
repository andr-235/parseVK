import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { taskAutomationService } from '@/services/taskAutomationService'
import { useTaskAutomationStore } from '@/store'
import { queryKeys } from '@/hooks/queryKeys'

export const useTaskAutomationQuery = () => {
  const query = useQuery({
    queryKey: queryKeys.taskAutomation,
    queryFn: taskAutomationService.fetchSettings,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!query.data) {
      return
    }

    useTaskAutomationStore.setState({ settings: query.data })
  }, [query.data])

  useEffect(() => {
    useTaskAutomationStore.setState({ isLoading: query.isFetching })
  }, [query.isFetching])

  return query
}
