import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type { IKeywordResponse, IBulkAddResponse, IDeleteResponse } from '@/shared/types'

export interface IKeywordFormsResponse {
  keywordId: number
  word: string
  isPhrase: boolean
  generatedForms: string[]
  manualForms: string[]
  exclusions: string[]
}

export interface IKeywordFormsRebuildResponse {
  keywordsRebuilt: number
  processed: number
  updated: number
  created: number
  deleted: number
}

export const keywordsService = {
  async addKeyword(
    word: string,
    category?: string | null,
    isPhrase?: boolean
  ): Promise<IKeywordResponse> {
    try {
      const result = await apiClient.post<IKeywordResponse>('/v1/keywords/add', { word, category, isPhrase })
      toast.success(isPhrase ? `Фраза «${word}» добавлена` : `Слово «${word}» добавлено`)
      return result
    } catch (error) {
      toast.error('Не удалось добавить ключевое слово')
      throw error
    }
  },

  async updateKeywordCategory(id: number, category?: string | null): Promise<IKeywordResponse> {
    try {
      const result = await apiClient.patch<IKeywordResponse>(`/v1/keywords/${id}`, { category: category ?? null })
      toast.success('Категория обновлена')
      return result
    } catch (error) {
      toast.error('Не удалось обновить категорию')
      throw error
    }
  },

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    try {
      const result = await apiClient.post<IBulkAddResponse>('/v1/keywords/bulk-add', { words })
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

      const response = await apiClient.raw('/v1/keywords/upload', { method: 'POST', body: formData })

      if (!response.ok) {
        throw new Error('Failed to upload keywords')
      }

      const result = (await response.json()) as IBulkAddResponse
      toast.success(`Загружено ключевых слов: ${result.successCount ?? 0}`)
      return result
    } catch (error) {
      toast.error('Не удалось загрузить ключевые слова')
      throw error
    }
  },

  async getAllKeywords(): Promise<IKeywordResponse[]> {
    try {
      const pageSize = 100
      let page = 1
      let total = 0
      const allKeywords: IKeywordResponse[] = []

      do {
        const result = await apiClient.get<{
          keywords: IKeywordResponse[]
          total: number
          page: number
          limit: number
        }>('/v1/keywords', { page, limit: pageSize })

        total = result.total
        allKeywords.push(...result.keywords)
        page += 1
      } while (allKeywords.length < total)

      return allKeywords
    } catch (error) {
      toast.error('Не удалось загрузить ключевые слова')
      throw error
    }
  },

  async deleteAllKeywords(): Promise<IDeleteResponse> {
    try {
      const result = await apiClient.delete<IDeleteResponse>('/v1/keywords/all')
      toast.success('Все ключевые слова удалены')
      return result
    } catch (error) {
      toast.error('Не удалось удалить ключевые слова')
      throw error
    }
  },

  async deleteKeyword(id: number): Promise<IKeywordResponse> {
    try {
      const result = await apiClient.delete<IKeywordResponse>(`/v1/keywords/${id}`)
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
      const result = await apiClient.post<{
        processed: number
        updated: number
        created: number
        deleted: number
      }>('/v1/keywords/recalculate-matches')
      return result
    } catch (error) {
      toast.error('Не удалось пересчитать совпадения ключевых слов')
      throw error
    }
  },

  async rebuildKeywordForms(): Promise<IKeywordFormsRebuildResponse> {
    try {
      const result = await apiClient.post<IKeywordFormsRebuildResponse>('/v1/keywords/rebuild-forms')
      return result
    } catch (error) {
      toast.error('Не удалось пересобрать словоформы ключевых слов')
      throw error
    }
  },

  async getKeywordForms(id: number): Promise<IKeywordFormsResponse> {
    return apiClient.get<IKeywordFormsResponse>(`/v1/keywords/${id}/forms`)
  },

  async addManualKeywordForm(id: number, form: string): Promise<IKeywordFormsResponse> {
    const result = await apiClient.post<IKeywordFormsResponse>(`/v1/keywords/${id}/forms/manual`, { form })
    toast.success('Ручная форма добавлена')
    return result
  },

  async removeManualKeywordForm(id: number, form: string): Promise<IKeywordFormsResponse> {
    const response = await apiClient.raw(`/v1/keywords/${id}/forms/manual`, {
      method: 'DELETE',
      body: JSON.stringify({ form }),
    })

    if (!response.ok) {
      throw new Error('Failed to remove manual keyword form')
    }

    const result = (await response.json()) as IKeywordFormsResponse
    toast.success('Ручная форма удалена')
    return result
  },

  async addKeywordFormExclusion(id: number, form: string): Promise<IKeywordFormsResponse> {
    const result = await apiClient.post<IKeywordFormsResponse>(`/v1/keywords/${id}/forms/exclusions`, { form })
    toast.success('Исключение добавлено')
    return result
  },

  async removeKeywordFormExclusion(id: number, form: string): Promise<IKeywordFormsResponse> {
    const response = await apiClient.raw(`/v1/keywords/${id}/forms/exclusions`, {
      method: 'DELETE',
      body: JSON.stringify({ form }),
    })

    if (!response.ok) {
      throw new Error('Failed to remove keyword form exclusion')
    }

    const result = (await response.json()) as IKeywordFormsResponse
    toast.success('Исключение удалено')
    return result
  },
}
