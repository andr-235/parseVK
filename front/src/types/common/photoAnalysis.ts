export type SuspicionLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'

export interface PhotoAnalysisSummaryCategory {
  name: string
  count: number
}

export interface PhotoAnalysisSummaryLevel {
  level: SuspicionLevel
  count: number
}

export interface PhotoAnalysisSummary {
  total: number
  suspicious: number
  lastAnalyzedAt: string | null
  categories: PhotoAnalysisSummaryCategory[]
  levels: PhotoAnalysisSummaryLevel[]
}
