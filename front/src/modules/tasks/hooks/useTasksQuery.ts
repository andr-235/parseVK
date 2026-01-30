import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { tasksService } from '@/modules/tasks/api/tasks.api'
import { useTasksStore } from '@/store'
import { mapSummaryToTask } from '@/store/tasksStore.mappers'
import { replaceTasksCollection } from '@/store/tasksStore.utils'
import { queryKeys } from '@/hooks/queryKeys'
import type { IParsingTaskSummary } from '@/types/api'

const mapSummariesToTasks = (summaries: IParsingTaskSummary[]) => {
  if (!Array.isArray(summaries)) {
    throw new Error(
      `Invalid API response: expected array of task summaries, got ${typeof summaries}. Response: ${JSON.stringify(summaries)}`
    )
  }
  return summaries.map((summary) => mapSummaryToTask(summary))
}

interface UseTasksQueryOptions {
  enabled?: boolean
}

export const useTasksQuery = (options?: UseTasksQueryOptions) => {
  const enabled = options?.enabled ?? true
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
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
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
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      useTasksStore.setState((state) => {
        state.isLoading = false
      })
      return
    }

    const hasTasks = useTasksStore.getState().taskIds.length > 0
    const shouldShowInitialLoading = query.isPending || (!hasTasks && query.isFetching)

    useTasksStore.setState((state) => {
      state.isLoading = shouldShowInitialLoading
    })
  }, [enabled, query.isFetching, query.isPending])

  useEffect(() => {
    if (!enabled) {
      return
    }

    if (query.isError) {
      useTasksStore.setState((state) => {
        state.isLoading = false
      })
    }
  }, [enabled, query.isError])

  return query
}
