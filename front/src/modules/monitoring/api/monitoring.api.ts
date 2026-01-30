import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
import type {
  IMonitorGroupDeleteResponse,
  IMonitorGroupResponse,
  IMonitorGroupsResponse,
  IMonitorMessagesResponse,
  MonitoringMessenger,
} from '@/types/api'

type MonitorMessagesParams = {
  keywords?: string[]
  limit?: number
  page?: number
  from?: string
  sources?: string[]
}

type MonitorGroupsParams = {
  messenger?: MonitoringMessenger
  search?: string
  category?: string
  sync?: boolean
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

  if (typeof params.from === 'string' && params.from.length > 0) {
    searchParams.set('from', params.from)
  }

  if (Array.isArray(params.sources)) {
    params.sources
      .map((source) => source.trim())
      .filter((source) => source.length > 0)
      .forEach((source) => {
        searchParams.append('sources', source)
      })
  }

  return searchParams.toString()
}

const buildGroupsQuery = (params?: MonitorGroupsParams): string => {
  if (!params) return ''

  const searchParams = new URLSearchParams()

  if (params.messenger) {
    searchParams.set('messenger', params.messenger)
  }

  if (params.search && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim())
  }

  if (params.category && params.category.trim().length > 0) {
    searchParams.set('category', params.category.trim())
  }

  if (params.sync) {
    searchParams.set('sync', 'true')
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

  async fetchGroups(params?: MonitorGroupsParams): Promise<IMonitorGroupsResponse> {
    try {
      const query = buildGroupsQuery(params)
      const url = query ? `${API_URL}/monitoring/groups?${query}` : `${API_URL}/monitoring/groups`
      const response = await createRequest(url)

      return await handleResponse<IMonitorGroupsResponse>(
        response,
        'Failed to fetch monitoring groups'
      )
    } catch (error) {
      toast.error('Не удалось загрузить группы мониторинга')
      throw error
    }
  },

  async createGroup(payload: {
    messenger: MonitoringMessenger
    chatId: string
    name: string
    category?: string | null
  }): Promise<IMonitorGroupResponse> {
    try {
      const response = await createRequest(`${API_URL}/monitoring/groups`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<IMonitorGroupResponse>(
        response,
        'Failed to create monitoring group'
      )
      toast.success('Группа сохранена')
      return result
    } catch (error) {
      toast.error('Не удалось сохранить группу')
      throw error
    }
  },

  async updateGroup(
    id: number,
    payload: {
      messenger?: MonitoringMessenger
      chatId?: string
      name?: string
      category?: string | null
    }
  ): Promise<IMonitorGroupResponse> {
    try {
      const response = await createRequest(`${API_URL}/monitoring/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<IMonitorGroupResponse>(
        response,
        'Failed to update monitoring group'
      )
      toast.success('Группа обновлена')
      return result
    } catch (error) {
      toast.error('Не удалось обновить группу')
      throw error
    }
  },

  async deleteGroup(id: number): Promise<IMonitorGroupDeleteResponse> {
    try {
      const response = await createRequest(`${API_URL}/monitoring/groups/${id}`, {
        method: 'DELETE',
      })

      const result = await handleResponse<IMonitorGroupDeleteResponse>(
        response,
        'Failed to delete monitoring group'
      )
      toast.success('Группа удалена')
      return result
    } catch (error) {
      toast.error('Не удалось удалить группу')
      throw error
    }
  },
}
