import { API_URL } from './config'
import { buildQueryString, createRequest, handleResponse } from './utils'
import type {
  IGroupResponse,
  IDeleteResponse,
  IGroupsListResponse,
  IRegionGroupSearchResponse,
} from '../types/api'
import type { SaveGroupDto } from '../dto'

export const groupsApi = {
  async saveGroup(dto: SaveGroupDto): Promise<IGroupResponse> {
    const response = await createRequest(`${API_URL}/groups/save`, {
      method: 'POST',
      body: JSON.stringify(dto),
    })

    return handleResponse<IGroupResponse>(response, 'Failed to save group')
  },

  async uploadGroups(file: File): Promise<{ saved: number; errors: string[] }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/groups/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload groups')
    }

    const data = await response.json()
    const failedErrors = Array.isArray(data?.failed)
      ? data.failed.map((item: { identifier?: string; error?: string; errorMessage?: string }) => {
          const message = item?.error ?? item?.errorMessage

          if (item?.identifier && typeof message === 'string') {
            return `${item.identifier}: ${message}`
          }

          return message ?? 'Unknown error'
        })
      : []

    return {
      saved: typeof data?.successCount === 'number' ? data.successCount : 0,
      errors: failedErrors,
    }
  },

  async getAllGroups(params?: { page?: number; limit?: number }): Promise<IGroupsListResponse> {
    const query = buildQueryString({
      page: params?.page,
      limit: params?.limit,
    })
    const url = `${API_URL}/groups${query ? `?${query}` : ''}`
    const response = await fetch(url)

    return handleResponse<IGroupsListResponse>(response, 'Failed to fetch groups')
  },

  async deleteAllGroups(): Promise<IDeleteResponse> {
    const response = await fetch(`${API_URL}/groups/all`, {
      method: 'DELETE',
    })

    return handleResponse<IDeleteResponse>(response, 'Failed to delete all groups')
  },

  async deleteGroup(id: number): Promise<IGroupResponse> {
    const response = await fetch(`${API_URL}/groups/${id}`, {
      method: 'DELETE',
    })

    return handleResponse<IGroupResponse>(response, 'Failed to delete group')
  },

  async searchRegionGroups(): Promise<IRegionGroupSearchResponse> {
    const response = await fetch(`${API_URL}/groups/search/region`)

    return handleResponse<IRegionGroupSearchResponse>(response, 'Failed to search region groups')
  },
}
