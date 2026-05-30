import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import { createEmptyPhotoAnalysisSummary } from '@/shared/types'
import type {
  AuthorCard,
  AuthorDetails,
  AuthorListResponse,
  AuthorSortField,
  AuthorSortOrder,
  PhotoAnalysisSummary,
} from '@/shared/types'
import type {
  AuthorCardResponse,
  AuthorDetailsResponse,
  AuthorsListResponse,
  RefreshAuthorsResponse,
} from '@/shared/types'

const normalizeSummary = (summary?: PhotoAnalysisSummary | null): PhotoAnalysisSummary => {
  const fallback = createEmptyPhotoAnalysisSummary()

  if (!summary) {
    return fallback
  }

  const summaryCategories = Array.isArray(summary.categories) ? summary.categories : []
  const summaryLevels = Array.isArray(summary.levels) ? summary.levels : []

  const categories = fallback.categories.map((category) => {
    const existing = summaryCategories.find((item) => item.name === category.name)
    return existing ? { ...existing } : { ...category }
  })

  const levels = fallback.levels.map((level) => {
    const existing = summaryLevels.find((item) => item.level === level.level)
    return existing ? { ...existing } : { ...level }
  })

  return {
    total: summary.total ?? fallback.total,
    suspicious: summary.suspicious ?? fallback.suspicious,
    lastAnalyzedAt: summary.lastAnalyzedAt ?? fallback.lastAnalyzedAt,
    categories,
    levels,
  }
}

const mapAuthorCard = (author: AuthorCardResponse): AuthorCard => ({
  id: author.id,
  vkUserId: author.vkUserId,
  firstName: author.firstName,
  lastName: author.lastName,
  fullName: author.fullName,
  photo50: author.photo50 ?? null,
  photo100: author.photo100 ?? null,
  photo200: author.photo200 ?? null,
  domain: author.domain ?? null,
  screenName: author.screenName ?? null,
  profileUrl: author.profileUrl ?? null,
  city: author.city ?? null,
  summary: normalizeSummary(author.summary),
  photosCount: author.photosCount ?? null,
  audiosCount: author.audiosCount ?? null,
  videosCount: author.videosCount ?? null,
  friendsCount: author.friendsCount ?? null,
  followersCount: author.followersCount ?? null,
  lastSeenAt: author.lastSeenAt ?? null,
  verifiedAt: author.verifiedAt ?? null,
  isVerified: Boolean(author.isVerified),
})

const mapAuthorDetails = (author: AuthorDetailsResponse): AuthorDetails => ({
  ...mapAuthorCard(author),
  city: author.city ?? null,
  country: author.country ?? null,
  createdAt: author.createdAt,
  updatedAt: author.updatedAt,
})

export const authorsService = {
  async fetchAuthors(
    params: {
      offset?: number
      limit?: number
      search?: string
      city?: string
      verified?: boolean
      sortBy?: AuthorSortField
      sortOrder?: AuthorSortOrder
    } = {}
  ): Promise<AuthorListResponse> {
    try {
      const data = await apiClient.get<AuthorsListResponse>('/v1/content/authors', {
        offset: params.offset,
        limit: params.limit,
        search: params.search,
        city: params.city,
        verified: params.verified,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })
      return {
        items: data.items.map(mapAuthorCard),
        total: data.total,
        hasMore: data.hasMore,
      }
    } catch (error) {
      toast.error('Ошибка загрузки авторов')
      throw error
    }
  },

  async getAuthorDetails(vkUserId: number): Promise<AuthorDetails> {
    try {
      const data = await apiClient.get<AuthorDetailsResponse>(`/v1/content/authors/${vkUserId}`)
      return mapAuthorDetails(data)
    } catch (error) {
      toast.error('Не удалось загрузить данные пользователя')
      throw error
    }
  },

  async refreshAuthors(): Promise<number> {
    try {
      const result = await apiClient.post<RefreshAuthorsResponse>('/v1/content/authors/refresh')
      toast.success('Карточки авторов обновлены')
      return result.updated
    } catch (error) {
      toast.error('Не удалось обновить авторов')
      throw error
    }
  },
  async deleteAuthor(vkUserId: number): Promise<void> {
    try {
      await apiClient.delete<{ deleted: boolean }>(`/v1/content/authors/${vkUserId}`)
    } catch (error) {
      toast.error('Не удалось удалить автора')
      throw error
    }
  },
  async verifyAuthor(vkUserId: number): Promise<string> {
    try {
      const response = await apiClient.raw(`/v1/content/authors/${vkUserId}/verify`, {
        method: 'PATCH',
        keepalive: true,
      })

      if (!response.ok) {
        throw new Error('Не удалось отметить автора как проверенного')
      }

      const data: { verifiedAt: string } = await response.json()
      return data.verifiedAt
    } catch (error) {
      toast.error('Не удалось отметить автора как проверенного')
      throw error
    }
  },
}

