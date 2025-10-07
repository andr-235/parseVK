import type { IGroupResponse, IDeleteResponse } from '../types/api'
import type { SaveGroupDto } from '../dto'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const groupsApi = {
  async saveGroup(dto: SaveGroupDto): Promise<IGroupResponse> {
    const response = await fetch(`${API_URL}/groups/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    if (!response.ok) throw new Error('Failed to save group')
    return response.json()
  },

  async uploadGroups(file: File): Promise<{ saved: number; errors: string[] }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/groups/upload`, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) throw new Error('Failed to upload groups')
    const data = await response.json()
    const failedErrors = Array.isArray(data?.failed)
      ? data.failed.map((item: { identifier?: string; error?: string }) => {
          if (item?.identifier && item?.error) {
            return `${item.identifier}: ${item.error}`
          }
          return item?.error ?? 'Unknown error'
        })
      : []

    return {
      saved: typeof data?.successCount === 'number' ? data.successCount : 0,
      errors: failedErrors
    }
  },

  async getAllGroups(): Promise<IGroupResponse[]> {
    const response = await fetch(`${API_URL}/groups`)
    if (!response.ok) throw new Error('Failed to fetch groups')
    return response.json()
  },

  async deleteAllGroups(): Promise<IDeleteResponse> {
    const response = await fetch(`${API_URL}/groups/all`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete all groups')
    return response.json()
  },

  async deleteGroup(id: number): Promise<IGroupResponse> {
    const response = await fetch(`${API_URL}/groups/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete group')
    return response.json()
  }
}
