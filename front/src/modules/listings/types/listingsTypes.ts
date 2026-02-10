export type ListingsMeta = {
  total?: number
  sources?: string[]
}

export type ListingsSortField =
  | 'createdAt'
  | 'price'
  | 'publishedAt'
  | 'source'
  | 'address'
  | 'title'
  | 'sourceAuthorName'

export type ListingsFetcherParams = {
  search?: string
  source?: string
  archived?: boolean
  sortBy?: ListingsSortField
  sortOrder?: 'asc' | 'desc'
}
