import type { AuthorSortField, AuthorSortOrder } from '@/types/authors'

type AuthorsQueryParams = {
  status: 'all' | 'verified' | 'unverified'
  search: string
  sortBy: AuthorSortField | null
  sortOrder: AuthorSortOrder
  pageSize: number
}

const buildAuthorsKey = (params: AuthorsQueryParams) =>
  [
    'authors',
    params.status,
    params.search,
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
  authors: {
    list: (params: AuthorsQueryParams) => buildAuthorsKey(params),
  },
  watchlist: {
    authors: ['watchlist', 'authors'] as const,
    settings: ['watchlist', 'settings'] as const,
  },
} as const

export type { AuthorsQueryParams }
