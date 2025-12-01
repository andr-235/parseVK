import { API_URL } from './config'
import { createRequest, handleResponse } from './utils'
import type { IKeywordResponse, IBulkAddResponse, IDeleteResponse } from '../types/api'

export const keywordsApi = {
  async addKeyword(word: string, category?: string | null): Promise<IKeywordResponse> {
    const response = await createRequest(`${API_URL}/keywords/add`, {
      method: 'POST',
      body: JSON.stringify({ word, category }),
    })

    return handleResponse<IKeywordResponse>(response, 'Failed to add keyword')
  },

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    const response = await createRequest(`${API_URL}/keywords/bulk-add`, {
      method: 'POST',
      body: JSON.stringify({ words }),
    })

    return handleResponse<IBulkAddResponse>(response, 'Failed to add keywords')
  },

  async uploadKeywords(file: File): Promise<IBulkAddResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/keywords/upload`, {
      method: 'POST',
      body: formData,
    })

    return handleResponse<IBulkAddResponse>(response, 'Failed to upload keywords')
  },

  async getAllKeywords(): Promise<IKeywordResponse[]> {
    const response = await fetch(`${API_URL}/keywords`)

    return handleResponse<IKeywordResponse[]>(response, 'Failed to fetch keywords')
  },

  async deleteAllKeywords(): Promise<IDeleteResponse> {
    const response = await fetch(`${API_URL}/keywords/all`, {
      method: 'DELETE',
    })

    return handleResponse<IDeleteResponse>(response, 'Failed to delete keywords')
  },

  async deleteKeyword(id: number): Promise<IKeywordResponse> {
    const response = await fetch(`${API_URL}/keywords/${id}`, {
      method: 'DELETE',
    })

    return handleResponse<IKeywordResponse>(response, 'Failed to delete keyword')
  },

  async recalculateKeywordMatches(): Promise<{
    processed: number
    updated: number
    created: number
    deleted: number
  }> {
    const response = await createRequest(`${API_URL}/keywords/recalculate-matches`, {
      method: 'POST',
    })

    return handleResponse<{
      processed: number
      updated: number
      created: number
      deleted: number
    }>(response, 'Failed to recalculate keyword matches')
  },
}
