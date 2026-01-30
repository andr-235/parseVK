export type CommentsFilters = {
  keywords?: string[]
  keywordSource?: 'COMMENT' | 'POST'
  readStatus?: 'all' | 'unread' | 'read'
  search?: string
}

export type CommentsQueryBase = {
  offset?: number
  limit?: number
  cursor?: string
}

export type CommentsQueryParams = CommentsQueryBase & CommentsFilters
