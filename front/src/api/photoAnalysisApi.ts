import { API_URL } from './config'
import { createRequest, handleResponse } from './utils'
import type {
  AnalyzePhotosOptions,
  PhotoAnalysisResponse,
  PhotoAnalysisSummary,
} from '@/types'

export const photoAnalysisApi = {
  async analyzeAuthor(
    vkUserId: number,
    options?: AnalyzePhotosOptions,
  ): Promise<PhotoAnalysisResponse> {
    const response = await createRequest(`${API_URL}/photo-analysis/vk/${vkUserId}/analyze`, {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    })

    return handleResponse<PhotoAnalysisResponse>(
      response,
      'Не удалось выполнить анализ фотографий автора',
    )
  },

  async getResults(vkUserId: number): Promise<PhotoAnalysisResponse> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}`)

    return handleResponse<PhotoAnalysisResponse>(
      response,
      'Не удалось загрузить результаты анализа фотографий',
    )
  },

  async getSuspicious(vkUserId: number): Promise<PhotoAnalysisResponse> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}/suspicious`)

    return handleResponse<PhotoAnalysisResponse>(
      response,
      'Не удалось загрузить список подозрительных фотографий',
    )
  },

  async getSummary(vkUserId: number): Promise<PhotoAnalysisSummary> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}/summary`)

    return handleResponse<PhotoAnalysisSummary>(
      response,
      'Не удалось загрузить сводку по анализу фотографий',
    )
  },

  async deleteResults(vkUserId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}`, {
      method: 'DELETE',
    })

    return handleResponse<{ message: string }>(response, 'Не удалось удалить результаты анализа')
  },
}
