import { create } from 'zustand'
import { watchlistService } from '@/modules/watchlist/api/watchlist.api'
import type {
  WatchlistAuthorCard,
  WatchlistAuthorDetails,
  WatchlistSettings,
  WatchlistStatus,
} from '@/types'
import {
  WATCHLIST_PAGE_SIZE,
  mapWatchlistAuthor,
  mapWatchlistDetails,
  mapWatchlistSettings,
} from './watchlistStore.utils'
import { queryClient } from '@/shared/api'
import { queryKeys } from '@/hooks/queryKeys'

type WatchlistAuthorsQueryData = {
  items: WatchlistAuthorCard[]
  total: number
  hasMore: boolean
}

interface WatchlistState {
  authors: WatchlistAuthorCard[]
  totalAuthors: number
  hasMoreAuthors: boolean
  isLoadingAuthors: boolean
  isLoadingMoreAuthors: boolean
  isCreatingAuthor: boolean
  selectedAuthor: WatchlistAuthorDetails | null
  isLoadingAuthorDetails: boolean
  settings: WatchlistSettings | null
  isLoadingSettings: boolean
  isUpdatingSettings: boolean
  error: string | null
  fetchAuthors: (options?: { reset?: boolean; limit?: number }) => Promise<void>
  fetchAuthorDetails: (id: number, options?: { offset?: number; limit?: number }) => Promise<void>
  addAuthorFromComment: (payload: { commentId: number }) => Promise<WatchlistAuthorCard>
  updateAuthorStatus: (id: number, status: WatchlistStatus) => Promise<WatchlistAuthorCard>
  fetchSettings: () => Promise<void>
  updateSettings: (payload: Partial<WatchlistSettings>) => Promise<WatchlistSettings>
  clearError: () => void
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  authors: [],
  totalAuthors: 0,
  hasMoreAuthors: false,
  isLoadingAuthors: false,
  isLoadingMoreAuthors: false,
  isCreatingAuthor: false,
  selectedAuthor: null,
  isLoadingAuthorDetails: false,
  settings: null,
  isLoadingSettings: false,
  isUpdatingSettings: false,
  error: null,

  clearError() {
    set({ error: null })
  },

  async fetchAuthors({ reset = false, limit }: { reset?: boolean; limit?: number } = {}) {
    const state = get()

    if (state.isLoadingAuthors || state.isLoadingMoreAuthors) {
      return
    }

    const offset = reset ? 0 : state.authors.length
    const pageSize = typeof limit === 'number' && limit > 0 ? limit : WATCHLIST_PAGE_SIZE

    if (!reset && !state.hasMoreAuthors) {
      return
    }

    if (reset) {
      set({ isLoadingAuthors: true })
    } else {
      set({ isLoadingMoreAuthors: true })
    }

    try {
      const response = await watchlistService.getAuthors({
        offset,
        limit: pageSize,
        excludeStopped: true,
      })
      if (!Array.isArray(response.items)) {
        throw new Error(
          `Invalid API response: expected 'items' to be an array, got ${typeof response.items}. Response: ${JSON.stringify(response)}`
        )
      }
      const mapped: WatchlistAuthorCard[] = response.items.map(mapWatchlistAuthor)

      set((prev) => ({
        authors: reset
          ? mapped
          : [
              ...prev.authors,
              ...mapped.filter(
                (author: WatchlistAuthorCard) =>
                  !prev.authors.some((existing) => existing.id === author.id)
              ),
            ],
        totalAuthors: response.total,
        hasMoreAuthors: response.hasMore,
        isLoadingAuthors: false,
        isLoadingMoreAuthors: false,
        error: null,
      }))

      queryClient.setQueryData<WatchlistAuthorsQueryData>(
        queryKeys.watchlist.authors,
        (prevData) => ({
          items: reset
            ? mapped
            : [
                ...(prevData?.items ?? []),
                ...mapped.filter(
                  (author: WatchlistAuthorCard) =>
                    !(prevData?.items ?? []).some((existing) => existing.id === author.id)
                ),
              ],
          total: response.total,
          hasMore: response.hasMore,
        })
      )
    } catch (error) {
      console.error('Не удалось загрузить список авторов "На карандаше"', error)
      set({
        isLoadingAuthors: false,
        isLoadingMoreAuthors: false,
        error: 'Не удалось загрузить список авторов',
      })
      throw error
    }
  },

  async fetchAuthorDetails(id, options) {
    set({ isLoadingAuthorDetails: true })

    try {
      const response = await watchlistService.getAuthorDetails(id, options)
      const mapped = mapWatchlistDetails(response)

      set({ selectedAuthor: mapped, isLoadingAuthorDetails: false, error: null })
    } catch (error) {
      console.error('Не удалось загрузить детали автора', error)
      set({ isLoadingAuthorDetails: false, error: 'Не удалось загрузить детали автора' })
      throw error
    }
  },

  async addAuthorFromComment(payload) {
    if (get().isCreatingAuthor) {
      throw new Error('Запрос уже выполняется')
    }

    set({ isCreatingAuthor: true })

    try {
      const response = await watchlistService.createAuthor(payload)
      const mapped = mapWatchlistAuthor(response)

      set((prev) => ({
        authors: [mapped, ...prev.authors.filter((author) => author.id !== mapped.id)],
        totalAuthors:
          prev.totalAuthors + (prev.authors.some((author) => author.id === mapped.id) ? 0 : 1),
        isCreatingAuthor: false,
        error: null,
      }))

      queryClient.setQueryData<WatchlistAuthorsQueryData>(
        queryKeys.watchlist.authors,
        (prevData) => {
          const existing = prevData?.items ?? []
          const filtered = existing.filter((item) => item.id !== mapped.id)
          return {
            items: [mapped, ...filtered],
            total:
              (prevData?.total ?? 0) + (existing.some((item) => item.id === mapped.id) ? 0 : 1),
            hasMore: prevData?.hasMore ?? false,
          }
        }
      )

      return mapped
    } catch (error) {
      console.error('Не удалось добавить автора', error)
      set({ isCreatingAuthor: false, error: 'Не удалось добавить автора' })
      throw error
    }
  },

  async updateAuthorStatus(id, status) {
    try {
      const response = await watchlistService.updateAuthor(id, { status })
      const mapped = mapWatchlistAuthor(response)

      set((prev) => {
        const wasStopped = prev.authors.find((a) => a.id === id)?.status === 'STOPPED'
        const willBeStopped = mapped.status === 'STOPPED'

        const nextAuthors = willBeStopped
          ? prev.authors.filter((author) => author.id !== id)
          : prev.authors.map((author) => (author.id === id ? mapped : author))

        const nextTotal =
          prev.totalAuthors +
          (willBeStopped && !wasStopped ? -1 : !willBeStopped && wasStopped ? 1 : 0)

        return {
          authors: nextAuthors,
          totalAuthors: Math.max(nextTotal, 0),
          selectedAuthor:
            prev.selectedAuthor && prev.selectedAuthor.id === id
              ? {
                  ...prev.selectedAuthor,
                  ...mapped,
                  comments: prev.selectedAuthor.comments,
                }
              : prev.selectedAuthor,
          error: null,
        }
      })

      queryClient.setQueryData<WatchlistAuthorsQueryData>(
        queryKeys.watchlist.authors,
        (prevData) => {
          const wasStopped = (prevData?.items ?? []).find((a) => a.id === id)?.status === 'STOPPED'
          const willBeStopped = mapped.status === 'STOPPED'
          const nextItems = willBeStopped
            ? (prevData?.items ?? []).filter((a) => a.id !== id)
            : (prevData?.items ?? []).map((a) => (a.id === id ? mapped : a))
          const nextTotal =
            (prevData?.total ?? 0) +
            (willBeStopped && !wasStopped ? -1 : !willBeStopped && wasStopped ? 1 : 0)

          return {
            items: nextItems,
            total: Math.max(nextTotal, 0),
            hasMore: prevData?.hasMore ?? false,
          }
        }
      )

      return mapped
    } catch (error) {
      console.error('Не удалось обновить статус автора', error)
      set({ error: 'Не удалось обновить статус автора' })
      throw error
    }
  },

  async fetchSettings() {
    set({ isLoadingSettings: true })

    try {
      const response = await watchlistService.getSettings()
      const mapped = mapWatchlistSettings(response)
      set({ settings: mapped, isLoadingSettings: false, error: null })
      queryClient.setQueryData(queryKeys.watchlist.settings, mapped)
    } catch (error) {
      console.error('Не удалось загрузить настройки мониторинга', error)
      set({ isLoadingSettings: false, error: 'Не удалось загрузить настройки мониторинга' })
      throw error
    }
  },

  async updateSettings(payload) {
    set({ isUpdatingSettings: true })

    try {
      const response = await watchlistService.updateSettings(payload)
      const mapped = mapWatchlistSettings(response)
      set({ settings: mapped, isUpdatingSettings: false, error: null })
      queryClient.setQueryData(queryKeys.watchlist.settings, mapped)
      return mapped
    } catch (error) {
      console.error('Не удалось обновить настройки мониторинга', error)
      set({ isUpdatingSettings: false, error: 'Не удалось обновить настройки мониторинга' })
      throw error
    }
  },
}))
