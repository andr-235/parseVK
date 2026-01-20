import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { createRequest, handleResponse } from '@/lib/apiUtils'
import type { IMonitorMessagesResponse } from '@/types/api'

type MonitorMessagesParams = {
  keywords?: string[]
  limit?: number
  page?: number
}

const buildQuery = (params?: MonitorMessagesParams): string => {
  if (!params) return ''

  const searchParams = new URLSearchParams()

  if (Array.isArray(params.keywords)) {
    params.keywords
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .forEach((keyword) => {
        searchParams.append('keywords', keyword)
      })
  }

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  if (typeof params.page === 'number') {
    searchParams.set('page', String(params.page))
  }

  return searchParams.toString()
}

export const monitoringService = {
  async fetchMessages(params?: MonitorMessagesParams): Promise<IMonitorMessagesResponse> {
    try {
      const query = buildQuery(params)
      const url = query
        ? `${API_URL}/monitoring/messages?${query}`
        : `${API_URL}/monitoring/messages`
      const response = await createRequest(url)

      return await handleResponse<IMonitorMessagesResponse>(
        response,
        'Failed to fetch monitoring messages'
      )
    } catch (error) {
      toast.error('Не удалось загрузить мониторинг')
      throw error
    }
  },
}
