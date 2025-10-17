import { create } from 'zustand'
import { authorsService } from '../services/authorsService'
import type { AuthorsState } from '../types/stores'

const DEFAULT_PAGE_SIZE = 24

export const useAuthorsStore = create<AuthorsState>((set, get) => ({
  authors: [],
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  search: '',
  statusFilter: 'unverified',
  pageSize: DEFAULT_PAGE_SIZE,

  fetchAuthors: async (options = {}) => {
    const { search, reset } = options as { search?: string; reset?: boolean }
    const state = get()
    const nextSearch = search ?? state.search
    const trimmedSearch = nextSearch.trim()
    const shouldReset = reset === true || search !== undefined
    const offset = shouldReset ? 0 : state.authors.length

    if (shouldReset) {
      set({ isLoading: true })
    } else {
      if (!state.hasMore || state.isLoadingMore) {
        return
      }
      set({ isLoadingMore: true })
    }

    try {
      const response = await authorsService.fetchAuthors({
        offset,
        limit: state.pageSize,
        search: trimmedSearch || undefined,
        verified:
          state.statusFilter === 'all'
            ? undefined
            : state.statusFilter === 'verified',
      })

      set((prev) => ({
        authors: offset === 0 ? response.items : [...prev.authors, ...response.items],
        total: response.total,
        hasMore: response.hasMore,
        isLoading: false,
        isLoadingMore: false,
        search: trimmedSearch,
      }))
    } catch (error) {
      set({
        isLoading: false,
        isLoadingMore: false,
      })
      throw error
    }
  },

  loadMore: async () => {
    await get().fetchAuthors({ reset: false })
  },

  setSearch: (value: string) => {
    set({ search: value })
  },

  setStatusFilter: (value) => {
    set(() => ({
      statusFilter: value,
      authors: [],
      total: 0,
      hasMore: false,
      isLoading: true,
      isLoadingMore: false,
    }))
  },

  markAuthorVerified: (vkUserId, verifiedAt) => {
    set((state) => {
      const index = state.authors.findIndex((item) => item.vkUserId === vkUserId)

      if (index === -1) {
        return {}
      }

      const resolvedVerifiedAt = verifiedAt ?? new Date().toISOString()

      if (state.statusFilter === 'unverified') {
        const nextAuthors = state.authors.filter((item) => item.vkUserId !== vkUserId)
        const nextTotal = state.total > 0 ? state.total - 1 : 0

        return {
          authors: nextAuthors,
          total: nextTotal,
        }
      }

      const nextAuthors = state.authors.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, isVerified: true, verifiedAt: resolvedVerifiedAt }
          : item
      )

      return {
        authors: nextAuthors,
      }
    })
  },

  refreshAuthors: async () => {
    const state = get()
    if (state.isRefreshing) {
      return
    }

    set({ isRefreshing: true })

    try {
      await authorsService.refreshAuthors()
      await get().fetchAuthors({ reset: true })
    } finally {
      set({ isRefreshing: false })
    }
  },
}))
