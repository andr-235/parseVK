import toast from 'react-hot-toast'
import { authorsApi } from '../api/authorsApi'
import type { AuthorsListResponse } from '../types/api'

export const authorsService = {
  async fetchAuthors(params: {
    offset?: number
    limit?: number
    search?: string
  } = {}): Promise<AuthorsListResponse> {
    try {
      return await authorsApi.fetchAuthors(params)
    } catch (error) {
      toast.error('Ошибка загрузки авторов')
      throw error
    }
  },

  async refreshAuthors(): Promise<number> {
    try {
      const result = await authorsApi.refreshAuthors()
      toast.success('Карточки авторов обновлены')
      return result.updated
    } catch (error) {
      toast.error('Не удалось обновить авторов')
      throw error
    }
  }
}
