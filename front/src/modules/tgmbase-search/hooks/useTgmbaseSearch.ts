import { useMutation } from '@tanstack/react-query'
import { tgmbaseSearchQueryKeys } from '@/modules/tgmbase-search/api/queryKeys'
import { tgmbaseSearchService } from '@/modules/tgmbase-search/api/tgmbaseSearch.api'

export const useTgmbaseSearch = () =>
  useMutation({
    mutationKey: tgmbaseSearchQueryKeys.all,
    mutationFn: tgmbaseSearchService.search,
  })
