import { create } from 'zustand'
import { authorsService } from '@/modules/authors/api/authors.api'
import type { AuthorListResponse, AuthorSortField } from '@/types'
import type { AuthorsState } from '@/types/stores'
import { queryClient } from '@/lib/queryClient'
import { queryKeys, type AuthorsQueryParams } from '@/hooks/queryKeys'

const DEFAULT_PAGE_SIZE = 24

const buildAuthorsQueryParams = (
  state: AuthorsState,
  search: string,
  city: string
): AuthorsQueryParams => ({
  status: state.statusFilter,
  search,
  city,
  sortBy: state.sortBy,
  sortOrder: state.sortBy ? state.sortOrder : 'desc',
  pageSize: state.pageSize,
})

export const useAuthorsStore = create<AuthorsState>((set, get) => ({
  authors: [],
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  search: '',
  cityFilter: '',
  statusFilter: 'unverified',
  pageSize: DEFAULT_PAGE_SIZE,
  sortBy: null,
  sortOrder: 'desc',

  fetchAuthors: async (options = {}) => {
    const { search, reset } = options as { search?: string; reset?: boolean }
    const state = get()
    const nextSearch = search ?? state.search
    const trimmedSearch = nextSearch.trim()
    const shouldReset = reset === true || search !== undefined
    const offset = shouldReset ? 0 : state.authors.length

    const trimmedCity = state.cityFilter.trim()
    const queryParams = buildAuthorsQueryParams(state, trimmedSearch, trimmedCity)
    const queryKey = queryKeys.authors.list(queryParams)

    if (shouldReset) {
      set({
        isLoading: true,
        search: trimmedSearch,
      })

      try {
        await queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
      } finally {
        const isFetching = queryClient.isFetching({ queryKey }) > 0
        set((current) => ({
          ...current,
          isLoading: isFetching,
          isLoadingMore: false,
        }))
      }
      return
    }

    if (!state.hasMore || state.isLoadingMore) {
      return
    }

    set({ isLoadingMore: true, search: trimmedSearch })

    try {
      const response = await authorsService.fetchAuthors({
        offset,
        limit: state.pageSize,
        search: trimmedSearch || undefined,
        city: trimmedCity || undefined,
        verified: state.statusFilter === 'all' ? undefined : state.statusFilter === 'verified',
        sortBy: state.sortBy ?? undefined,
        sortOrder: state.sortBy ? state.sortOrder : undefined,
      })

      if (!Array.isArray(response.items)) {
        throw new Error(
          `Invalid API response: expected 'items' to be an array, got ${typeof response.items}. Response: ${JSON.stringify(response)}`
        )
      }

      set((prev) => ({
        authors: offset === 0 ? response.items : [...prev.authors, ...response.items],
        total: response.total,
        hasMore: response.hasMore,
        isLoading: false,
        isLoadingMore: false,
        search: trimmedSearch,
      }))

      queryClient.setQueryData<AuthorListResponse>(queryKey, (prevData) => {
        if (!prevData || offset === 0) {
          return response
        }

        const existingIds = new Set(prevData.items.map((item) => item.id))
        const mergedItems = [
          ...prevData.items,
          ...response.items.filter((item) => !existingIds.has(item.id)),
        ]

        return {
          items: mergedItems,
          total: response.total,
          hasMore: response.hasMore,
        }
      })
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

  setCityFilter: (value: string) => {
    set(() => ({
      cityFilter: value,
      authors: [],
      total: 0,
      hasMore: false,
      isLoading: true,
      isLoadingMore: false,
    }))
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

  setSort: (field: AuthorSortField) => {
    const state = get()
    const isSameField = state.sortBy === field

    let nextSortBy: AuthorsState['sortBy']
    let nextSortOrder: AuthorsState['sortOrder']

    if (!isSameField) {
      nextSortBy = field
      nextSortOrder = 'desc'
    } else if (state.sortOrder === 'desc') {
      nextSortBy = field
      nextSortOrder = 'asc'
    } else {
      nextSortBy = null
      nextSortOrder = 'desc'
    }

    set(() => ({
      sortBy: nextSortBy,
      sortOrder: nextSortOrder,
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
        itemIndex === index ? { ...item, isVerified: true, verifiedAt: resolvedVerifiedAt } : item
      )

      return {
        authors: nextAuthors,
      }
    })
  },

  verifyAuthor: async (vkUserId: number) => {
    const verifiedAt = await authorsService.verifyAuthor(vkUserId)
    get().markAuthorVerified(vkUserId, verifiedAt)

    const updatedState = get()
    const params = buildAuthorsQueryParams(
      updatedState,
      updatedState.search.trim(),
      updatedState.cityFilter.trim()
    )
    const queryKey = queryKeys.authors.list(params)

    await queryClient.invalidateQueries({ queryKey, refetchType: 'active' })

    return verifiedAt
  },

  refreshAuthors: async () => {
    const state = get()
    if (state.isRefreshing) {
      return
    }

    set({ isRefreshing: true })

    try {
      await authorsService.refreshAuthors()
      const stateAfterRefresh = get()
      const params = buildAuthorsQueryParams(
        stateAfterRefresh,
        stateAfterRefresh.search.trim(),
        stateAfterRefresh.cityFilter.trim()
      )
      const queryKey = queryKeys.authors.list(params)
      await queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
    } finally {
      set({ isRefreshing: false })
    }
  },
  deleteAuthor: async (vkUserId: number) => {
    await authorsService.deleteAuthor(vkUserId)
    set((state) => ({
      authors: state.authors.filter((item) => item.vkUserId !== vkUserId),
      total: Math.max(0, state.total - 1),
    }))

    const updatedState = get()
    const params = buildAuthorsQueryParams(
      updatedState,
      updatedState.search.trim(),
      updatedState.cityFilter.trim()
    )
    const queryKey = queryKeys.authors.list(params)

    await queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
  },
}))
