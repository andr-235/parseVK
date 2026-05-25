import { useMutation } from '@tanstack/react-query'
import { tgmbaseSearchQueryKeys } from '@/api/tgmbase-search/queryKeys'
import { tgmbaseSearchService } from '@/api/tgmbase-search/tgmbaseSearch.api'

export const useTgmbaseSearch = () =>
  useMutation({
    mutationKey: tgmbaseSearchQueryKeys.all,
    mutationFn: tgmbaseSearchService.search,
  })
