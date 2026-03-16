import { useQuery } from '@tanstack/react-query'
import { searchComments } from '@/modules/comments/api/comments.api'
import type { CommentsSearchRequestDto } from '@/modules/comments/api/dto/commentsSearch.dto'

export const useCommentsSearchQuery = (
  payload: CommentsSearchRequestDto,
  options?: { enabled?: boolean }
) => {
  const enabled = options?.enabled ?? true

  return useQuery({
    queryKey: ['comments', 'search', payload],
    queryFn: () => searchComments(payload),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
