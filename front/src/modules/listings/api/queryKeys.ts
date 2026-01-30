export type ListingsQueryParams = {
  page: number
  pageSize: number
  search: string
  source: string
}

const listingsBase = ['listings'] as const

const buildListingsKey = (params: ListingsQueryParams) =>
  [...listingsBase, 'list', params.page, params.pageSize, params.search, params.source] as const

export const listingsQueryKeys = {
  all: listingsBase,
  list: (params: ListingsQueryParams) => buildListingsKey(params),
} as const
