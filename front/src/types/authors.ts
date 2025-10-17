import type { PhotoAnalysisSummary } from './photoAnalysis'

export interface AuthorCard {
  id: number
  vkUserId: number
  firstName: string
  lastName: string
  fullName: string
  photo50: string | null
  photo100: string | null
  photo200: string | null
  domain: string | null
  screenName: string | null
  profileUrl: string | null
  summary: PhotoAnalysisSummary
  photosCount: number | null
  audiosCount: number | null
  videosCount: number | null
  friendsCount: number | null
  followersCount: number | null
  lastSeenAt: string | null
  verifiedAt: string | null
  isVerified: boolean
}

export interface AuthorDetails extends AuthorCard {
  city: Record<string, unknown> | null
  country: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface AuthorListResponse {
  items: AuthorCard[]
  total: number
  hasMore: boolean
}
