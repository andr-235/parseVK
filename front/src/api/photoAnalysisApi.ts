import type {
  AnalyzePhotosOptions,
  PhotoAnalysisResponse,
  PhotoAnalysisSummary,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const photoAnalysisApi = {
  async analyzeAuthor(
    vkUserId: number,
    options?: AnalyzePhotosOptions
  ): Promise<PhotoAnalysisResponse> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options ?? {}),
    })

    if (!response.ok) {
      throw new Error('Не удалось выполнить анализ фотографий автора')
    }

    return response.json()
  },

  async getResults(vkUserId: number): Promise<PhotoAnalysisResponse> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}`)

    if (!response.ok) {
      throw new Error('Не удалось загрузить результаты анализа фотографий')
    }

    return response.json()
  },

  async getSuspicious(vkUserId: number): Promise<PhotoAnalysisResponse> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}/suspicious`)

    if (!response.ok) {
      throw new Error('Не удалось загрузить список подозрительных фотографий')
    }

    return response.json()
  },

  async getSummary(vkUserId: number): Promise<PhotoAnalysisSummary> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}/summary`)

    if (!response.ok) {
      throw new Error('Не удалось загрузить сводку по анализу фотографий')
    }

    return response.json()
  },

  async deleteResults(vkUserId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Не удалось удалить результаты анализа')
    }

    return response.json()
  },
}
