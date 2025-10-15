import { API_URL } from './config'
import type { IKeywordResponse, IBulkAddResponse, IDeleteResponse } from '../types/api'

export const keywordsApi = {
  async addKeyword(word: string, category?: string | null): Promise<IKeywordResponse> {
    const response = await fetch(`${API_URL}/keywords/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, category })
    })
    if (!response.ok) throw new Error('Failed to add keyword')
    return response.json()
  },

  async bulkAddKeywords(words: string[]): Promise<IBulkAddResponse> {
    const response = await fetch(`${API_URL}/keywords/bulk-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words })
    })
    if (!response.ok) throw new Error('Failed to add keywords')
    return response.json()
  },

  async uploadKeywords(file: File): Promise<IBulkAddResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/keywords/upload`, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) throw new Error('Failed to upload keywords')
    return response.json()
  },

  async getAllKeywords(): Promise<IKeywordResponse[]> {
    const response = await fetch(`${API_URL}/keywords`)
    if (!response.ok) throw new Error('Failed to fetch keywords')
    return response.json()
  },

  async deleteAllKeywords(): Promise<IDeleteResponse> {
    const response = await fetch(`${API_URL}/keywords/all`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete keywords')
    return response.json()
  },

  async deleteKeyword(id: number): Promise<IKeywordResponse> {
    const response = await fetch(`${API_URL}/keywords/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete keyword')
    return response.json()
  }
}
