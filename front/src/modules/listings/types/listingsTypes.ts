export type ListingsMeta = {
  total?: number
  sources?: string[]
}

export type ListingsSortField =
  | 'createdAt'
  | 'price'
  | 'publishedAt'
  | 'sourceParsedAt'
  | 'source'
  | 'address'
  | 'title'
  | 'sourceAuthorName'
  | 'contactPhone'
  | 'sourceAuthorUrl'

export type ListingsFetcherParams = {
  search?: string
  source?: string
  archived?: boolean
  sortBy?: ListingsSortField
  sortOrder?: 'asc' | 'desc'
}
