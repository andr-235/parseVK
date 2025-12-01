import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { createRequest, handleResponse } from '@/lib/apiUtils'
import type {
  AnalyzePhotosOptions,
  PhotoAnalysisResponse,
  PhotoAnalysisSummary,
} from '@/types'

export const photoAnalysisService = {
  async analyzeAuthor(
    vkUserId: number,
    options?: AnalyzePhotosOptions,
  ): Promise<PhotoAnalysisResponse> {
    try {
      const response = await createRequest(`${API_URL}/photo-analysis/vk/${vkUserId}/analyze`, {
        method: 'POST',
        body: JSON.stringify(options ?? {}),
      })

      const result = await handleResponse<PhotoAnalysisResponse>(
        response,
        'Не удалось выполнить анализ фотографий автора',
      )
      toast.success('Анализ фотографий запущен')
      return result
    } catch (error) {
      toast.error('Не удалось выполнить анализ фотографий автора')
      throw error
    }
  },

  async getResults(vkUserId: number): Promise<PhotoAnalysisResponse> {
    try {
      const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}`)
      return await handleResponse<PhotoAnalysisResponse>(
        response,
        'Не удалось загрузить результаты анализа фотографий',
      )
    } catch (error) {
      toast.error('Не удалось загрузить результаты анализа фотографий')
      throw error
    }
  },

  async getSuspicious(vkUserId: number): Promise<PhotoAnalysisResponse> {
    try {
      const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}/suspicious`)
      return await handleResponse<PhotoAnalysisResponse>(
        response,
        'Не удалось загрузить список подозрительных фотографий',
      )
    } catch (error) {
      toast.error('Не удалось загрузить список подозрительных фотографий')
      throw error
    }
  },

  async getSummary(vkUserId: number): Promise<PhotoAnalysisSummary> {
    try {
      const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}/summary`)
      return await handleResponse<PhotoAnalysisSummary>(
        response,
        'Не удалось загрузить сводку по анализу фотографий',
      )
    } catch (error) {
      toast.error('Не удалось загрузить сводку по анализу фотографий')
      throw error
    }
  },

  async deleteResults(vkUserId: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_URL}/photo-analysis/vk/${vkUserId}`, {
        method: 'DELETE',
      })

      const result = await handleResponse<{ message: string }>(response, 'Не удалось удалить результаты анализа')
      toast.success('Результаты анализа удалены')
      return result
    } catch (error) {
      toast.error('Не удалось удалить результаты анализа')
      throw error
    }
  },
}

