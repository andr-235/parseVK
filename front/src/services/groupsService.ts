import { groupsApi } from '../api/groupsApi'
import type { Group } from '../types'
import type { IRegionGroupSearchResponse } from '../types/api'
import type { SaveGroupDto } from '../dto'
import toast from 'react-hot-toast'

export const groupsService = {
  async fetchGroups(): Promise<Group[]> {
    try {
      const response = await groupsApi.getAllGroups()
      return response
    } catch (error) {
      toast.error('Ошибка загрузки групп')
      throw error
    }
  },

  async addGroup(name: string, description?: string): Promise<Group | null> {
    if (!name.trim()) return null

    try {
      const dto: SaveGroupDto = { identifier: name.trim() }
      if (description) {
        dto.description = description.trim()
      }
      const response = await groupsApi.saveGroup(dto)
      toast.success('Группа добавлена')
      return response
    } catch (error) {
      toast.error('Ошибка при добавлении группы')
      throw error
    }
  },

  async deleteGroup(id: number): Promise<void> {
    try {
      await groupsApi.deleteGroup(id)
      toast.success('Группа удалена')
    } catch (error) {
      toast.error('Ошибка при удалении группы')
      throw error
    }
  },

  async deleteAllGroups(): Promise<number> {
    try {
      const response = await groupsApi.deleteAllGroups()
      const deletedCount = typeof response?.count === 'number' ? response.count : 0

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
      const response = await groupsApi.uploadGroups(file)
      toast.success(`Загружено групп: ${response.saved}`)
      if (response.errors.length > 0) {
        toast.error(`Ошибок: ${response.errors.length}`)
      }
      return response
    } catch (error) {
      toast.error('Ошибка при загрузке файла с группами')
      throw error
    }
  },

  async searchRegionGroups(): Promise<IRegionGroupSearchResponse> {
    try {
      return await groupsApi.searchRegionGroups()
    } catch (error) {
      toast.error('Ошибка поиска групп по региону')
      throw error
    }
  }

}
