import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type {
  IGroupResponse,
  IDeleteResponse,
  IGroupsListResponse,
  IRegionGroupSearchResponse,
} from '@/shared/types'
import type { SaveGroupDto } from '@/shared/types'

export const groupsService = {
  async fetchGroups(params?: { page?: number; limit?: number }): Promise<IGroupsListResponse> {
    try {
      const data = await apiClient.get<IGroupsListResponse>('/v1/content/groups', {
        page: params?.page,
        limit: params?.limit,
      })
      if (!Array.isArray(data.items)) {
        throw new Error(
          `Invalid API response: expected 'items' to be an array, got ${typeof data.items}. Response: ${JSON.stringify(data)}`
        )
      }
      return {
        ...data,
        items: data.items,
        total: typeof data.total === 'number' ? data.total : 0,
        page: typeof data.page === 'number' ? data.page : 0,
        limit: typeof data.limit === 'number' ? data.limit : (params?.limit ?? 20),
        hasMore: Boolean(data.hasMore),
      }
    } catch (error) {
      toast.error('Ошибка загрузки групп')
      throw error
    }
  },

  async addGroup(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _description = '',
    options?: { silent?: boolean }
  ): Promise<IGroupResponse | null> {
    if (!name.trim()) return null

    try {
      const dto: SaveGroupDto = { identifier: name.trim() }
      const data = await apiClient.post<IGroupResponse>('/v1/content/groups/save', dto)
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
      await apiClient.delete<IGroupResponse>(`/v1/content/groups/${id}`)
      toast.success('Группа удалена')
    } catch (error) {
      toast.error('Ошибка при удалении группы')
      throw error
    }
  },

  async deleteAllGroups(): Promise<number> {
    try {
      const data = await apiClient.delete<IDeleteResponse>('/v1/content/groups/all')
      const deletedCount = typeof data?.count === 'number' ? data.count : 0

      toast.success(deletedCount > 0 ? `Удалено групп: ${deletedCount}` : 'Список групп уже пуст')

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

      const response = await apiClient.raw('/groups/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload groups')
      }

      const data = await response.json()
      const failedErrors = Array.isArray(data?.failed)
        ? data.failed.map(
            (item: { identifier?: string; error?: string; errorMessage?: string }) => {
              const message = item?.error ?? item?.errorMessage

              if (item?.identifier && typeof message === 'string') {
                return `${item.identifier}: ${message}`
              }

              return message ?? 'Unknown error'
            }
          )
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
      return await apiClient.get<IRegionGroupSearchResponse>('/v1/content/groups/search/region')
    } catch (error) {
      toast.error('Ошибка поиска групп по региону')
      throw error
    }
  },
}
