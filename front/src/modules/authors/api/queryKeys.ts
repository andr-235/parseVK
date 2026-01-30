import type { AuthorSortField, AuthorSortOrder } from '@/modules/authors/types'

export type AuthorsQueryParams = {
  status: 'all' | 'verified' | 'unverified'
  search: string
  city: string
  sortBy: AuthorSortField | null
  sortOrder: AuthorSortOrder
  pageSize: number
}

const authorsBase = ['authors'] as const

const buildAuthorsKey = (params: AuthorsQueryParams) =>
  [
    ...authorsBase,
    'list',
    params.status,
    params.search,
    params.city,
    params.sortBy ?? 'none',
    params.sortOrder,
    params.pageSize,
  ] as const

export const authorsQueryKeys = {
  all: authorsBase,
  list: (params: AuthorsQueryParams) => buildAuthorsKey(params),
} as const
