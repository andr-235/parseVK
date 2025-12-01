import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { buildQueryString, createRequest, handleResponse } from '@/lib/apiUtils'
import type { IGroupResponse, IDeleteResponse, IGroupsListResponse, IRegionGroupSearchResponse } from '../types/api'
import type { SaveGroupDto } from '../dto'

export const groupsService = {
  async fetchGroups(params?: { page?: number; limit?: number }): Promise<IGroupsListResponse> {
    try {
      const query = buildQueryString({
        page: params?.page,
        limit: params?.limit,
      })
      const url = `${API_URL}/groups${query ? `?${query}` : ''}`
      const response = await fetch(url)

      const data = await handleResponse<IGroupsListResponse>(response, 'Failed to fetch groups')
      return {
        ...data,
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === 'number' ? data.total : 0,
        page: typeof data.page === 'number' ? data.page : 0,
        limit: typeof data.limit === 'number' ? data.limit : params?.limit ?? 20,
        hasMore: Boolean(data.hasMore),
      }
    } catch (error) {
      toast.error('Ошибка загрузки групп')
      throw error
    }
  },

  async addGroup(
    name: string,
    description = '',
    options?: { silent?: boolean }
  ): Promise<IGroupResponse | null> {
    if (!name.trim()) return null

    try {
      const dto: SaveGroupDto = { identifier: name.trim() }
      if (description.trim()) {
        dto.description = description.trim()
      }
      const response = await createRequest(`${API_URL}/groups/save`, {
        method: 'POST',
        body: JSON.stringify(dto),
      })

      const data = await handleResponse<IGroupResponse>(response, 'Failed to save group')
      if (!options?.silent) {
        toast.success('Группа добавлена')
      }
      return data
    } catch (error) {
      if (!options?.silent) {
        toast.error('Ошибка при добавлении группы')
      }
      throw error
    }
  },

  async deleteGroup(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/groups/${id}`, {
        method: 'DELETE',
      })

      await handleResponse<IGroupResponse>(response, 'Failed to delete group')
      toast.success('Группа удалена')
    } catch (error) {
      toast.error('Ошибка при удалении группы')
      throw error
    }
  },

  async deleteAllGroups(): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/groups/all`, {
        method: 'DELETE',
      })

      const data = await handleResponse<IDeleteResponse>(response, 'Failed to delete all groups')
      const deletedCount = typeof data?.count === 'number' ? data.count : 0

      toast.success(
        deletedCount > 0
          ? `Удалено групп: ${deletedCount}`
          : 'Список групп уже пуст'
      )

      return deletedCount
    } catch (error) {
      toast.error('Ошибка при очистке групп')
      throw error
    }
  },

  async uploadGroupsFile(file: File): Promise<{ saved: number; errors: string[] }> {
    try {
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

      const result = {
        saved: typeof data?.successCount === 'number' ? data.successCount : 0,
        errors: failedErrors,
      }

      toast.success(`Загружено групп: ${result.saved}`)
      const errorsCount = result.errors.length
      if (errorsCount > 0) {
        toast.error(`Ошибок: ${errorsCount}`)
      }
      return result
    } catch (error) {
      toast.error('Ошибка при загрузке файла с группами')
      throw error
    }
  },

  async searchRegionGroups(): Promise<IRegionGroupSearchResponse> {
    try {
      const response = await fetch(`${API_URL}/groups/search/region`)
      return await handleResponse<IRegionGroupSearchResponse>(response, 'Failed to search region groups')
    } catch (error) {
      toast.error('Ошибка поиска групп по региону')
      throw error
    }
  }
}
