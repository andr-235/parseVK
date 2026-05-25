import toast from 'react-hot-toast'
import { API_URL } from '@/api/common'
import { createRequest, handleResponse } from '@/api/common'
import type { TgmbaseSearchRequest, TgmbaseSearchResponse } from '@/types/common'

export const tgmbaseSearchService = {
  async search(payload: TgmbaseSearchRequest): Promise<TgmbaseSearchResponse> {
    try {
      const response = await createRequest(`${API_URL}/tgmbase/search`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return await handleResponse<TgmbaseSearchResponse>(
        response,
        'Не удалось выполнить поиск по tgmbase'
      )
    } catch (error) {
      toast.error('Не удалось выполнить поиск по tgmbase')
      throw error
    }
  },
}
