export type SuspicionLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'

export interface PhotoAnalysis {
  id: number
  authorId: number
  photoUrl: string
  photoVkId: string
  hasSuspicious: boolean
  suspicionLevel: SuspicionLevel
  categories: string[]
  confidence: number | null
  explanation: string | null
  analyzedAt: string
}

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

const KNOWN_CATEGORIES = [
  'violence',
  'drugs',
  'weapons',
  'nsfw',
  'extremism',
  'hate speech',
] as const

export const createEmptyPhotoAnalysisSummary = (): PhotoAnalysisSummary => ({
  total: 0,
  suspicious: 0,
  lastAnalyzedAt: null,
  categories: KNOWN_CATEGORIES.map((name) => ({ name, count: 0 })),
  levels: [
    { level: 'NONE', count: 0 },
    { level: 'LOW', count: 0 },
    { level: 'MEDIUM', count: 0 },
    { level: 'HIGH', count: 0 },
  ],
})

export interface PhotoAnalysisResponse {
  items: PhotoAnalysis[]
  total: number
  suspiciousCount: number
  analyzedCount: number
  summary: PhotoAnalysisSummary
}

export interface AnalyzePhotosOptions {
  limit?: number
  force?: boolean
  offset?: number
}
