export type ListingsMeta = {
  total?: number
  sources?: string[]
}

export type ListingsFetcherParams = {
  search?: string
  source?: string
  archived?: boolean
}
