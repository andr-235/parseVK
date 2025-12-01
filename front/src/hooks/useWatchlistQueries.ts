import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { watchlistService } from '@/services/watchlistService'
import { useWatchlistStore } from '@/store'
import { queryKeys } from '@/hooks/queryKeys'
import {
  WATCHLIST_PAGE_SIZE,
  mapWatchlistAuthor,
  mapWatchlistSettings,
} from '@/store/watchlistStore.utils'

const fetchWatchlistAuthors = async () => {
  const response = await watchlistService.getAuthors({ offset: 0, limit: WATCHLIST_PAGE_SIZE, excludeStopped: true })
  return {
    items: response.items.map(mapWatchlistAuthor),
    total: response.total,
    hasMore: response.hasMore,
  }
}

export const useWatchlistAuthorsQuery = (enabled: boolean) => {
  const query = useQuery({
    queryKey: queryKeys.watchlist.authors,
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

    useWatchlistStore.setState((state) => {
      const incoming = query.data.items
      const existing = state.authors
      const incomingIds = new Set(incoming.map((item) => item.id))
      // сохраняем элементы из уже загруженных страниц, но исключаем STOPPED
      const extras = existing.filter((item) => !incomingIds.has(item.id) && item.status !== 'STOPPED')

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
    queryKey: queryKeys.watchlist.settings,
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
