import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { tasksService } from '@/services/tasksService'
import { useTasksStore } from '@/store'
import { mapSummaryToTask } from '@/store/tasksStore.mappers'
import { replaceTasksCollection } from '@/store/tasksStore.utils'
import { queryKeys } from '@/hooks/queryKeys'
import type { IParsingTaskSummary } from '@/types/api'

const mapSummariesToTasks = (summaries: IParsingTaskSummary[]) => {
  return Array.isArray(summaries) ? summaries.map((summary) => mapSummaryToTask(summary)) : []
}

export const useTasksQuery = () => {
  const previousDataRef = useRef<IParsingTaskSummary[] | null>(null)
  const isSocketConnected = useTasksStore((s) => s.isSocketConnected)

  const query = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: tasksService.fetchTasks,
    // Когда сокет подключён — не поллим. Когда нет — поллим раз в 15 сек.
    refetchInterval: isSocketConnected ? false : 15_000,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!query.data) {
      return
    }

    if (previousDataRef.current === query.data) {
      return
    }

    previousDataRef.current = query.data

    const mapped = mapSummariesToTasks(query.data)

    useTasksStore.setState((state) => {
      replaceTasksCollection(state, mapped)
    })
  }, [query.data])

  useEffect(() => {
    const hasTasks = useTasksStore.getState().taskIds.length > 0
    const shouldShowInitialLoading = query.isPending || (!hasTasks && query.isFetching)

    useTasksStore.setState((state) => {
      state.isLoading = shouldShowInitialLoading
    })
  }, [query.isFetching, query.isPending])

  useEffect(() => {
    if (query.isError) {
      useTasksStore.setState((state) => {
        state.isLoading = false
      })
    }
  }, [query.isError])

  return query
}
