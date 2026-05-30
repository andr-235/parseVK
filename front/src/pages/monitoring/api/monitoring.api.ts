import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type {
  IMonitorGroupDeleteResponse,
  IMonitorGroupResponse,
  IMonitorGroupsResponse,
  IMonitorMessagesResponse,
  MonitoringMessenger,
} from '@/shared/types'

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

const MONITORING_MESSAGES_ERROR_TOAST_ID = 'monitoring-messages-fetch-error'
const MONITORING_GROUPS_ERROR_TOAST_ID = 'monitoring-groups-fetch-error'

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
      return await apiClient.get<IMonitorMessagesResponse>(
        query ? `/v1/monitoring/messages?${query}` : '/v1/monitoring/messages'
      )
    } catch (error) {
      toast.error('Не удалось загрузить мониторинг', {
        id: MONITORING_MESSAGES_ERROR_TOAST_ID,
      })
      throw error
    }
  },

  async fetchGroups(params?: MonitorGroupsParams): Promise<IMonitorGroupsResponse> {
    try {
      const query = buildGroupsQuery(params)
      return await apiClient.get<IMonitorGroupsResponse>(
        query ? `/v1/monitoring/groups?${query}` : '/v1/monitoring/groups'
      )
    } catch (error) {
      toast.error('Не удалось загрузить группы мониторинга', {
        id: MONITORING_GROUPS_ERROR_TOAST_ID,
      })
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
      const result = await apiClient.post<IMonitorGroupResponse>('/v1/monitoring/groups', payload)
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
      const result = await apiClient.patch<IMonitorGroupResponse>(
        `/v1/monitoring/groups/${id}`,
        payload
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
      const result = await apiClient.delete<IMonitorGroupDeleteResponse>(
        `/v1/monitoring/groups/${id}`
      )
      toast.success('Группа удалена')
      return result
    } catch (error) {
      toast.error('Не удалось удалить группу')
      throw error
    }
  },
}
