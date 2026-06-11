import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export type WatchlistAuthorProfile = {
  id: number
  vkAuthorId: number
  displayName: string
  fullName: string
  photo50: string | null
  screenName: string | null
  profileUrl: string
  city: { id: number; title: string } | null
  photosCount: number | null
  friendsCount: number | null
  followersCount: number | null
  isVerified: boolean
  createdAt: string
  lastSeenAt: string | null
}

export type WatchlistAuthorSummary = {
  total: number
  suspicious: number
  lastAnalyzedAt: string | null
  categories: string[]
  levels: string[]
}

export type WatchlistAuthor = {
  id: number
  authorVkId: number
  status: 'ACTIVE' | 'STOPPED'
  lastCheckedAt: string | null
  lastActivityAt: string | null
  foundCommentsCount: number
  monitoringStartedAt: string
  monitoringStoppedAt: string | null
  author: WatchlistAuthorProfile | null
  summary: WatchlistAuthorSummary
}

export type WatchlistSettings = {
  id: number
  trackAllComments: boolean
  pollIntervalMinutes: number
  maxAuthors: number
}

export type WatchlistComment = {
  id: number
  ownerId: number
  postId: number
  vkCommentId: number
  text: string | null
  publishedAt: string | null
  createdAt: string
  source: string
}

export type WatchlistAuthorDetails = WatchlistAuthor & {
  comments: {
    items: WatchlistComment[]
    total: number
    hasMore: boolean
  }
}

export async function fetchWatchlistAuthors(params?: {
  offset?: number
  limit?: number
  excludeStopped?: boolean
}): Promise<{ items: WatchlistAuthor[]; total: number; hasMore: boolean }> {
  return apiGet<{ items: WatchlistAuthor[]; total: number; hasMore: boolean }>(
    '/watchlist/authors',
    params as Record<string, string | number | undefined>
  )
}

export async function createWatchlistAuthor(payload: {
  authorVkId?: number
  commentId?: number
}): Promise<WatchlistAuthor> {
  return apiPost<WatchlistAuthor>('/watchlist/authors', payload)
}

export async function fetchWatchlistAuthorDetails(
  id: number,
  params?: { offset?: number; limit?: number }
): Promise<WatchlistAuthorDetails> {
  return apiGet<WatchlistAuthorDetails>(
    `/watchlist/authors/${id}`,
    params as Record<string, string | number | undefined>
  )
}

export async function updateWatchlistAuthor(
  id: number,
  payload: { status: 'ACTIVE' | 'STOPPED' }
): Promise<WatchlistAuthor> {
  return apiPatch<WatchlistAuthor>(`/watchlist/authors/${id}`, payload)
}

export async function deleteWatchlistAuthor(id: number): Promise<void> {
  await apiDelete<void>(`/watchlist/authors/${id}`)
}

export async function fetchWatchlistSettings(): Promise<WatchlistSettings> {
  return apiGet<WatchlistSettings>('/watchlist/settings')
}

export async function updateWatchlistSettings(
  payload: Partial<Omit<WatchlistSettings, 'id'>>
): Promise<WatchlistSettings> {
  return apiPatch<WatchlistSettings>('/watchlist/settings', payload)
}

export async function refreshWatchlist(): Promise<{ status: string; new_comments: number }> {
  return apiPost<{ status: string; new_comments: number }>('/watchlist/refresh')
}
