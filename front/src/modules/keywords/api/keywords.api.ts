import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
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
      const response = await createRequest(`${API_URL}/keywords/add`, {
        method: 'POST',
        body: JSON.stringify({ word, category, isPhrase }),
      })

      const result = await handleResponse<IKeywordResponse>(response, 'Failed to add keyword')
      toast.success(isPhrase ? `Фраза «${word}» добавлена` : `Слово «${word}» добавлено`)
      return result
    } catch (error) {
      toast.error('Не удалось добавить ключевое слово')
      throw error
    }
  },

  async updateKeywordCategory(id: number, category?: string | null): Promise<IKeywordResponse> {
    try {
      const response = await createRequest(`${API_URL}/keywords/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ category: category ?? null }),
      })

      const result = await handleResponse<IKeywordResponse>(
        response,
        'Failed to update keyword category'
      )
      toast.success('Категория обновлена')
      return result
    } catch (error) {
      toast.error('Не удалось обновить категорию')
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
      const pageSize = 100
      let page = 1
      let total = 0
      const allKeywords: IKeywordResponse[] = []

      do {
        const searchParams = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        })
        const response = await createRequest(`${API_URL}/keywords?${searchParams.toString()}`)
        const result = await handleResponse<{
          keywords: IKeywordResponse[]
          total: number
          page: number
          limit: number
        }>(response, 'Failed to fetch keywords')

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

  async rebuildKeywordForms(): Promise<IKeywordFormsRebuildResponse> {
    try {
      const response = await createRequest(`${API_URL}/keywords/rebuild-forms`, {
        method: 'POST',
      })

      const result = await handleResponse<IKeywordFormsRebuildResponse>(
        response,
        'Failed to rebuild keyword forms'
      )
      toast.success('Словоформы ключевых слов пересобраны')
      return result
    } catch (error) {
      toast.error('Не удалось пересобрать словоформы ключевых слов')
      throw error
    }
  },

  async getKeywordForms(id: number): Promise<IKeywordFormsResponse> {
    const response = await createRequest(`${API_URL}/keywords/${id}/forms`)
    return handleResponse<IKeywordFormsResponse>(response, 'Failed to fetch keyword forms')
  },

  async addManualKeywordForm(id: number, form: string): Promise<IKeywordFormsResponse> {
    const response = await createRequest(`${API_URL}/keywords/${id}/forms/manual`, {
      method: 'POST',
      body: JSON.stringify({ form }),
    })

    const result = await handleResponse<IKeywordFormsResponse>(
      response,
      'Failed to add manual keyword form'
    )
    toast.success('Ручная форма добавлена')
    return result
  },

  async removeManualKeywordForm(id: number, form: string): Promise<IKeywordFormsResponse> {
    const response = await createRequest(`${API_URL}/keywords/${id}/forms/manual`, {
      method: 'DELETE',
      body: JSON.stringify({ form }),
    })

    const result = await handleResponse<IKeywordFormsResponse>(
      response,
      'Failed to remove manual keyword form'
    )
    toast.success('Ручная форма удалена')
    return result
  },

  async addKeywordFormExclusion(id: number, form: string): Promise<IKeywordFormsResponse> {
    const response = await createRequest(`${API_URL}/keywords/${id}/forms/exclusions`, {
      method: 'POST',
      body: JSON.stringify({ form }),
    })

    const result = await handleResponse<IKeywordFormsResponse>(
      response,
      'Failed to add keyword form exclusion'
    )
    toast.success('Исключение добавлено')
    return result
  },

  async removeKeywordFormExclusion(id: number, form: string): Promise<IKeywordFormsResponse> {
    const response = await createRequest(`${API_URL}/keywords/${id}/forms/exclusions`, {
      method: 'DELETE',
      body: JSON.stringify({ form }),
    })

    const result = await handleResponse<IKeywordFormsResponse>(
      response,
      'Failed to remove keyword form exclusion'
    )
    toast.success('Исключение удалено')
    return result
  },
}
