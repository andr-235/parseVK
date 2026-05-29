import { useMutation } from '@tanstack/react-query'
import { tgmbaseSearchQueryKeys } from '@/pages/tgmbase-search/api/queryKeys'
import { tgmbaseSearchService } from '@/pages/tgmbase-search/api/tgmbaseSearch.api'

export const useTgmbaseSearch = () =>
  useMutation({
    mutationKey: tgmbaseSearchQueryKeys.all,
    mutationFn: tgmbaseSearchService.search,
  })
