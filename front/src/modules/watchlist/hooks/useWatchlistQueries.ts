import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

// Использование services напрямую в queryFn - стандартный паттерн React Query
// Store обновляется через useEffect после получения данных
import { watchlistService } from '@/modules/watchlist/api/watchlist.api'
import { watchlistQueryKeys } from '@/modules/watchlist/api/queryKeys'
import { useWatchlistStore } from '@/store'
import {
  WATCHLIST_PAGE_SIZE,
  mapWatchlistAuthor,
  mapWatchlistSettings,
} from '@/store/watchlist/watchlistStore.utils'

const fetchWatchlistAuthors = async () => {
  const response = await watchlistService.getAuthors({
    offset: 0,
    limit: WATCHLIST_PAGE_SIZE,
    excludeStopped: true,
  })
  if (!Array.isArray(response.items)) {
    throw new Error(
      `Invalid API response: expected 'items' to be an array, got ${typeof response.items}. Response: ${JSON.stringify(response)}`
    )
  }
  return {
    items: response.items.map(mapWatchlistAuthor),
    total: response.total,
    hasMore: response.hasMore,
  }
}

export const useWatchlistAuthorsQuery = (enabled: boolean) => {
  const query = useQuery({
    queryKey: watchlistQueryKeys.authors(),
    queryFn: fetchWatchlistAuthors,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    if (!Array.isArray(query.data.items)) {
      console.error('Invalid query data: items is not an array', query.data)
      return
    }

    useWatchlistStore.setState((state) => {
      const incoming = query.data.items
      const existing = state.authors
      const incomingIds = new Set(incoming.map((item) => item.id))
      // сохраняем элементы из уже загруженных страниц, но исключаем STOPPED
      const extras = existing.filter(
        (item) => !incomingIds.has(item.id) && item.status !== 'STOPPED'
      )

      return {
        ...state,
        authors: [...incoming, ...extras],
        totalAuthors: query.data.total,
        hasMoreAuthors: query.data.hasMore,
        isLoadingAuthors: false,
        isLoadingMoreAuthors: false,
      }
    })
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const hasAuthors = useWatchlistStore.getState().authors.length > 0
    const shouldShowLoading = query.isFetching && !hasAuthors

    useWatchlistStore.setState((state) => ({
      ...state,
      isLoadingAuthors: shouldShowLoading,
    }))
  }, [enabled, query.isFetching])

  return query
}

const fetchWatchlistSettings = async () => {
  const response = await watchlistService.getSettings()
  return mapWatchlistSettings(response)
}

export const useWatchlistSettingsQuery = (enabled: boolean) => {
  const query = useQuery({
    queryKey: watchlistQueryKeys.settings(),
    queryFn: fetchWatchlistSettings,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled,
  })

  useEffect(() => {
    if (!enabled || !query.data) {
      return
    }

    useWatchlistStore.setState((state) => ({
      ...state,
      settings: query.data,
      isLoadingSettings: false,
    }))
  }, [enabled, query.data])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const hasSettings = Boolean(useWatchlistStore.getState().settings)
    const shouldShowLoading = query.isFetching && !hasSettings

    useWatchlistStore.setState((state) => ({
      ...state,
      isLoadingSettings: shouldShowLoading,
    }))
  }, [enabled, query.isFetching])

  return query
}
