import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { photoAnalysisApi } from '@/api/photoAnalysisApi'
import type {
  AnalyzePhotosOptions,
  PhotoAnalysis,
  PhotoAnalysisResponse,
  PhotoAnalysisSummary,
} from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

type PhotoFilter = 'all' | 'suspicious'

interface PhotoAnalysisState {
  analyses: PhotoAnalysis[]
  summary: PhotoAnalysisSummary | null
  total: number
  suspiciousCount: number
  analyzedCount: number
  isLoading: boolean
  isAnalyzing: boolean
  filter: PhotoFilter
  error: string | null
  analyzeAuthor: (
    vkUserId: number,
    options?: AnalyzePhotosOptions
  ) => Promise<PhotoAnalysisResponse>
  fetchResults: (vkUserId: number) => Promise<PhotoAnalysisResponse>
  fetchSuspicious: (vkUserId: number) => Promise<PhotoAnalysisResponse>
  fetchSummary: (vkUserId: number) => Promise<PhotoAnalysisSummary>
  deleteResults: (vkUserId: number) => Promise<void>
  setFilter: (filter: PhotoFilter) => void
  clear: () => void
}

export const usePhotoAnalysisStore = create<PhotoAnalysisState>()(
  devtools(
    (set) => ({
      analyses: [],
      summary: createEmptyPhotoAnalysisSummary(),
      total: 0,
      suspiciousCount: 0,
      analyzedCount: 0,
      isLoading: false,
      isAnalyzing: false,
      filter: 'all',
      error: null,

      async analyzeAuthor(vkUserId, options) {
        set({ isAnalyzing: true, error: null })
        try {
          const response = await photoAnalysisApi.analyzeAuthor(vkUserId, options)
          set({
            analyses: response.items,
            summary: response.summary,
            total: response.total,
            suspiciousCount: response.suspiciousCount,
            analyzedCount: response.analyzedCount,
            isAnalyzing: false,
          })
          return response
        } catch (error) {
          set({ isAnalyzing: false, error: error instanceof Error ? error.message : 'Ошибка анализа фотографий' })
          throw error
        }
      },

      async fetchResults(vkUserId) {
        set({ isLoading: true, error: null })
        try {
          const response = await photoAnalysisApi.getResults(vkUserId)
          set({
            analyses: response.items,
            summary: response.summary,
            total: response.total,
            suspiciousCount: response.suspiciousCount,
            analyzedCount: response.analyzedCount,
            isLoading: false,
          })
          return response
        } catch (error) {
          set({ isLoading: false, error: error instanceof Error ? error.message : 'Ошибка загрузки результатов' })
          throw error
        }
      },

      async fetchSuspicious(vkUserId) {
        set({ isLoading: true, error: null })
        try {
          const response = await photoAnalysisApi.getSuspicious(vkUserId)
          set({
            analyses: response.items,
            summary: response.summary,
            total: response.total,
            suspiciousCount: response.suspiciousCount,
            analyzedCount: response.analyzedCount,
            isLoading: false,
          })
          return response
        } catch (error) {
          set({ isLoading: false, error: error instanceof Error ? error.message : 'Ошибка загрузки результатов' })
          throw error
        }
      },

      async fetchSummary(vkUserId) {
        try {
          const summary = await photoAnalysisApi.getSummary(vkUserId)
          set({ summary })
          return summary
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Ошибка загрузки сводки' })
          throw error
        }
      },

      async deleteResults(vkUserId) {
        set({ isLoading: true, error: null })
        try {
          await photoAnalysisApi.deleteResults(vkUserId)
          set({
            analyses: [],
            summary: createEmptyPhotoAnalysisSummary(),
            total: 0,
            suspiciousCount: 0,
            analyzedCount: 0,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false, error: error instanceof Error ? error.message : 'Ошибка удаления результатов' })
          throw error
        }
      },

      setFilter(filter) {
        set({ filter })
      },

      clear() {
        set({
          analyses: [],
          summary: createEmptyPhotoAnalysisSummary(),
          total: 0,
          suspiciousCount: 0,
          analyzedCount: 0,
          isLoading: false,
          isAnalyzing: false,
          filter: 'all',
          error: null,
        })
      },
    }),
    { name: 'PhotoAnalysisStore' }
  )
)
