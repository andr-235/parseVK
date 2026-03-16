import type { CommentsFilters } from './commentsQuery.types'
import type { CommentsSearchRequestDto, CommentsSearchViewMode } from '../dto/commentsSearch.dto'

export interface CommentsSearchParams extends CommentsFilters {
  query: string
  viewMode: CommentsSearchViewMode
  page?: number
  pageSize?: number
}

export const shouldUseCommentsSearch = ({
  query,
  viewMode,
}: {
  query: string
  viewMode: CommentsSearchViewMode
}) => {
  const trimmedQuery = query.trim()
  return trimmedQuery.length > 0 || viewMode === 'posts'
}

export const buildCommentsSearchPayload = (
  params: CommentsSearchParams
): CommentsSearchRequestDto => ({
  query: params.query.trim(),
  viewMode: params.viewMode,
  page: params.page ?? 1,
  pageSize: params.pageSize ?? 20,
  keywords: params.keywords,
  keywordSource: params.keywordSource,
  readStatus: params.readStatus,
})
