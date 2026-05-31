import { useQuery } from '@tanstack/react-query'
import { fetchComments, type CommentsQueryParams } from '../api/comments'

export function useComments(params: CommentsQueryParams) {
  return useQuery({
    queryKey: ['comments', params],
    queryFn: () => fetchComments(params),
    placeholderData: (prev) => prev,
  })
}
