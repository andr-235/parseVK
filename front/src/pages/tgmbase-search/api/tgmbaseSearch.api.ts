import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type { TgmbaseSearchRequest, TgmbaseSearchResponse } from '@/shared/types'

export const tgmbaseSearchService = {
  async search(payload: TgmbaseSearchRequest): Promise<TgmbaseSearchResponse> {
    try {
      return await apiClient.post<TgmbaseSearchResponse>('/v1/telegram-tgmbase/tgmbase/search', payload)
    } catch (error) {
      toast.error('Не удалось выполнить поиск по tgmbase')
      throw error
    }
  },
}
