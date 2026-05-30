import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type { AnalyzePhotosOptions, PhotoAnalysisResponse } from '@/pages/author-analysis/types/photoAnalysis'
import type { PhotoAnalysisSummary } from '@/shared/types'

export const photoAnalysisService = {
  async analyzeAuthor(
    vkUserId: number,
    options?: AnalyzePhotosOptions
  ): Promise<PhotoAnalysisResponse> {
    try {
      const result = await apiClient.post<PhotoAnalysisResponse>(
        `/v1/photo-analysis/vk/${vkUserId}/analyze`,
        options ?? {}
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
      return await apiClient.get<PhotoAnalysisResponse>(`/v1/photo-analysis/vk/${vkUserId}`)
    } catch (error) {
      toast.error('Не удалось загрузить результаты анализа фотографий')
      throw error
    }
  },

  async getSuspicious(vkUserId: number): Promise<PhotoAnalysisResponse> {
    try {
      return await apiClient.get<PhotoAnalysisResponse>(`/v1/photo-analysis/vk/${vkUserId}/suspicious`)
    } catch (error) {
      toast.error('Не удалось загрузить список подозрительных фотографий')
      throw error
    }
  },

  async getSummary(vkUserId: number): Promise<PhotoAnalysisSummary> {
    try {
      return await apiClient.get<PhotoAnalysisSummary>(`/v1/photo-analysis/vk/${vkUserId}/summary`)
    } catch (error) {
      toast.error('Не удалось загрузить сводку по анализу фотографий')
      throw error
    }
  },

  async deleteResults(vkUserId: number): Promise<{ message: string }> {
    try {
      const result = await apiClient.delete<{ message: string }>(`/v1/photo-analysis/vk/${vkUserId}`)
      toast.success('Результаты анализа удалены')
      return result
    } catch (error) {
      toast.error('Не удалось удалить результаты анализа')
      throw error
    }
  },
}
