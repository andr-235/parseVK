import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
import type { IKeywordResponse, IBulkAddResponse, IDeleteResponse } from '@/types/api'

export const keywordsService = {
  async addKeyword(
    word: string,
    category?: string | null,
    isPhrase?: boolean
  ): Promise<IKeywordResponse> {
    try {
      const response = await createRequest(`${API_URL}/keywords/add`, {
        method: 'POST',
        body: JSON.stringify({ word, category, isPhrase }),
      })

      const result = await handleResponse<IKeywordResponse>(response, 'Failed to add keyword')
      toast.success(isPhrase ? 'Фраза добавлена' : 'Ключевое слово добавлено')
      return result
    } catch (error) {
      toast.error('Не удалось добавить ключевое слово')
      throw error
    }
  },

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    try {
      const response = await createRequest(`${API_URL}/keywords/bulk-add`, {
        method: 'POST',
        body: JSON.stringify({ words }),
      })

      const result = await handleResponse<IBulkAddResponse>(response, 'Failed to add keywords')
      toast.success(`Добавлено ключевых слов: ${result.successCount ?? 0}`)
      return result
    } catch (error) {
      toast.error('Не удалось добавить ключевые слова')
      throw error
    }
  },

  async uploadKeywords(file: File): Promise<IBulkAddResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await createRequest(`${API_URL}/keywords/upload`, {
        method: 'POST',
        body: formData,
      })

      const result = await handleResponse<IBulkAddResponse>(response, 'Failed to upload keywords')
      toast.success(`Загружено ключевых слов: ${result.successCount ?? 0}`)
      return result
    } catch (error) {
      toast.error('Не удалось загрузить ключевые слова')
      throw error
    }
  },

  async getAllKeywords(): Promise<IKeywordResponse[]> {
    try {
      const response = await createRequest(`${API_URL}/keywords`)
      const result = await handleResponse<{
        keywords: IKeywordResponse[]
        total: number
        page: number
        limit: number
      }>(response, 'Failed to fetch keywords')
      return result.keywords
    } catch (error) {
      toast.error('Не удалось загрузить ключевые слова')
      throw error
    }
  },

  async deleteAllKeywords(): Promise<IDeleteResponse> {
    try {
      const response = await createRequest(`${API_URL}/keywords/all`, {
        method: 'DELETE',
      })

      const result = await handleResponse<IDeleteResponse>(response, 'Failed to delete keywords')
      toast.success('Все ключевые слова удалены')
      return result
    } catch (error) {
      toast.error('Не удалось удалить ключевые слова')
      throw error
    }
  },

  async deleteKeyword(id: number): Promise<IKeywordResponse> {
    try {
      const response = await createRequest(`${API_URL}/keywords/${id}`, {
        method: 'DELETE',
      })

      const result = await handleResponse<IKeywordResponse>(response, 'Failed to delete keyword')
      toast.success('Ключевое слово удалено')
      return result
    } catch (error) {
      toast.error('Не удалось удалить ключевое слово')
      throw error
    }
  },

  async recalculateKeywordMatches(): Promise<{
    processed: number
    updated: number
    created: number
    deleted: number
  }> {
    try {
      const response = await createRequest(`${API_URL}/keywords/recalculate-matches`, {
        method: 'POST',
      })

      const result = await handleResponse<{
        processed: number
        updated: number
        created: number
        deleted: number
      }>(response, 'Failed to recalculate keyword matches')
      toast.success('Пересчёт совпадений ключевых слов завершён')
      return result
    } catch (error) {
      toast.error('Не удалось пересчитать совпадения ключевых слов')
      throw error
    }
  },
}
