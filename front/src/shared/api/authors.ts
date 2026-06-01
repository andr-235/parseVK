import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export type Author = {
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
  verifiedAt: string | null
  createdAt: string
  lastSeenAt: string | null
}

type BackendAuthor = {
  id: number
  vkAuthorId: number
  displayName: string | null
  fullName: string
  photo50: string | null
  screenName: string | null
  profileUrl: string
  city: { id: number; title: string } | null
  photosCount: number | null
  friendsCount: number | null
  followersCount: number | null
  verifiedAt: string | null
  isVerified: boolean
  createdAt: string
  lastSeenAt: string | null
}

function mapAuthor(b: BackendAuthor): Author {
  return {
    id: b.id,
    vkAuthorId: b.vkAuthorId,
    displayName: b.displayName || '',
    fullName: b.fullName,
    photo50: b.photo50,
    screenName: b.screenName,
    profileUrl: b.profileUrl,
    city: b.city,
    photosCount: b.photosCount,
    friendsCount: b.friendsCount,
    followersCount: b.followersCount,
    isVerified: b.isVerified,
    verifiedAt: b.verifiedAt,
    createdAt: b.createdAt,
    lastSeenAt: b.lastSeenAt,
  }
}

export type AuthorsResponse = {
  items: Author[]
  total: number
  hasMore: boolean
}

export type AuthorsQueryParams = {
  limit?: number
  page?: number
  search?: string
  city?: string
  verified?: string
  type?: string
  sortBy?: string
  sortOrder?: string
}

export async function fetchAuthors(params?: AuthorsQueryParams): Promise<AuthorsResponse> {
  const data = await apiGet<{ items: BackendAuthor[]; total: number; hasMore: boolean }>(
    '/content/authors',
    params as Record<string, string | number | undefined>,
  )
  return { items: data.items.map(mapAuthor), total: data.total, hasMore: data.hasMore }
}

export async function verifyAuthor(vkAuthorId: number): Promise<void> {
  await apiPatch<{ status: string }>(`/content/authors/${vkAuthorId}/verify`, {})
}

export async function deleteAuthor(vkAuthorId: number): Promise<void> {
  await apiDelete<{ deleted: boolean }>(`/content/authors/${vkAuthorId}`)
}

export async function refreshAuthors(): Promise<number> {
  const res = await apiPost<{ updated: number }>('/content/authors/refresh')
  return res.updated
}
