/**
 * Типы для компонента AuthorAnalysis
 */

import type { AuthorDetails } from './authors'
import type { PhotoAnalysis, PhotoAnalysisSummary } from './photoAnalysis'

/**
 * Состояние location.state для AuthorAnalysis
 */
export interface AuthorAnalysisLocationState {
  author?: {
    vkUserId: number
    firstName?: string
    lastName?: string
    fullName?: string
    avatar?: string | null
    profileUrl?: string | null
    screenName?: string | null
    domain?: string | null
  }
  summary?: PhotoAnalysisSummary
}

/**
 * Пропсы для компонента AuthorAnalysis
 */
export interface AuthorAnalysisProps {
  vkUserId?: string
}

/**
 * Состояние автора в компоненте
 */
export interface AuthorState {
  author: AuthorDetails | null
  isAuthorLoading: boolean
}

/**
 * Состояние анализа фотографий
 */
export interface PhotoAnalysisState {
  analyses: PhotoAnalysis[]
  summary: PhotoAnalysisSummary | null
  isLoading: boolean
  isAnalyzing: boolean
  filter: 'all' | 'suspicious'
}

/**
 * Параметры анализа фотографий
 */
export interface AnalysisParams {
  totalPhotos: number
  maxBatches: number
  batchSize: number
}

/**
 * Результаты анализа пакета фотографий
 */
export interface BatchAnalysisResult {
  analyzedCount: number
  processedInBatch: number
  offset: number
  shouldContinue: boolean
}