import type { CommentsFilters } from '@/shared/types'

type CommentsQueryBase = {
  offset?: number
  limit?: number
  cursor?: string
}

export type CommentsQueryParams = CommentsQueryBase & CommentsFilters

export const buildCommentsQuery = (params?: CommentsQueryParams): string => {
  if (!params) {
    return ''
  }

  const searchParams = new URLSearchParams()

  if (typeof params.offset === 'number') {
    searchParams.set('offset', String(params.offset))
  }

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  if (params.cursor) {
    searchParams.set('cursor', params.cursor)
  }

  params.keywords
    ?.map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0)
    .forEach((keyword) => {
      searchParams.append('keywords', keyword)
    })

  if (params.keywordSource) {
    searchParams.set('keywordSource', params.keywordSource)
  }

  if (params.readStatus && params.readStatus !== 'all') {
    searchParams.set('readStatus', params.readStatus)
  }

  const normalizedSearch = params.search?.trim()
  if (normalizedSearch) {
    searchParams.set('search', normalizedSearch)
  }

  return searchParams.toString()
}
