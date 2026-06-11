import { apiGet, apiPost, apiPatch, apiDelete } from './client'
import type {
  MonitorMessagesResponse,
  MonitoringGroupsResponse,
  MonitoringGroup,
  MonitoringGroupCreatePayload,
  MonitoringGroupUpdatePayload,
} from '../../types/monitoring'

export type FetchMonitoringMessagesParams = {
  keywords?: string[]
  limit?: number
  page?: number
  from?: string
  sources?: string[]
}

export function fetchMonitoringMessages(params: FetchMonitoringMessagesParams): Promise<MonitorMessagesResponse> {
  return apiGet('/monitoring/messages', params as Record<string, string | number | undefined>)
}

export function fetchMonitoringGroups(params: {
  messenger?: string
  search?: string
  category?: string
  sync?: boolean
}): Promise<MonitoringGroupsResponse> {
  return apiGet('/monitoring/groups', params as Record<string, string | number | undefined>)
}

export function createMonitoringGroup(payload: MonitoringGroupCreatePayload): Promise<MonitoringGroup> {
  return apiPost('/monitoring/groups', payload)
}

export function updateMonitoringGroup(id: number, payload: MonitoringGroupUpdatePayload): Promise<MonitoringGroup> {
  return apiPatch(`/monitoring/groups/${id}`, payload)
}

export function deleteMonitoringGroup(id: number): Promise<void> {
  return apiDelete(`/monitoring/groups/${id}`)
}
