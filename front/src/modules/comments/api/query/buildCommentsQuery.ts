import type { CommentsQueryParams } from './commentsQuery.types'

export const buildCommentsQuery = (params?: CommentsQueryParams): string => {
  if (!params) {
    return ''
  }

  const searchParams = new URLSearchParams()

  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset))
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit))
  }

  if (params.cursor) {
    searchParams.set('cursor', params.cursor)
  }

  params.keywords
    ?.map((keyword) => keyword.trim())
    .filter(Boolean)
    .forEach((keyword) => searchParams.append('keywords', keyword))

  if (params.keywordSource) {
    searchParams.set('keywordSource', params.keywordSource)
  }

  if (params.readStatus && params.readStatus !== 'all') {
    searchParams.set('readStatus', params.readStatus)
  }

  const search = params.search?.trim()
  if (search) {
    searchParams.set('search', search)
  }

  return searchParams.toString()
}
