import type { AuthorSortField, AuthorSortOrder } from '@/types/authors'

type ListingsQueryParams = {
  page: number
  pageSize: number
  search: string
  source: string
}

const buildListingsKey = (params: ListingsQueryParams) =>
  ['listings', params.page, params.pageSize, params.search, params.source] as const

type AuthorsQueryParams = {
  status: 'all' | 'verified' | 'unverified'
  search: string
  city: string
  sortBy: AuthorSortField | null
  sortOrder: AuthorSortOrder
  pageSize: number
}

const buildAuthorsKey = (params: AuthorsQueryParams) =>
  [
    'authors',
    params.status,
    params.search,
    params.city,
    params.sortBy ?? 'none',
    params.sortOrder,
    params.pageSize,
  ] as const

export const queryKeys = {
  tasks: ['tasks'] as const,
  groups: ['groups'] as const,
  keywords: ['keywords'] as const,
  comments: ['comments'] as const,
  taskAutomation: ['task-automation'] as const,
  listings: {
    base: ['listings'] as const,
    list: (params: ListingsQueryParams) => buildListingsKey(params),
  },
  authors: {
    list: (params: AuthorsQueryParams) => buildAuthorsKey(params),
  },
  watchlist: {
    authors: ['watchlist', 'authors'] as const,
    settings: ['watchlist', 'settings'] as const,
  },
} as const

export type { AuthorsQueryParams, ListingsQueryParams }
