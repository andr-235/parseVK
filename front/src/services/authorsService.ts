import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { buildQueryString, handleResponse } from '@/lib/apiUtils'
import { createEmptyPhotoAnalysisSummary } from '@/types'
import type {
  AuthorCard,
  AuthorDetails,
  AuthorListResponse,
  AuthorSortField,
  AuthorSortOrder,
  PhotoAnalysisSummary,
} from '@/types'
import type {
  AuthorCardResponse,
  AuthorDetailsResponse,
  AuthorsListResponse,
  RefreshAuthorsResponse,
} from '@/types/api'

const normalizeSummary = (summary?: PhotoAnalysisSummary | null): PhotoAnalysisSummary => {
  const fallback = createEmptyPhotoAnalysisSummary()

  if (!summary) {
    return fallback
  }

  const categories = fallback.categories.map((category) => {
    const existing = summary.categories.find((item) => item.name === category.name)
    return existing ? { ...existing } : { ...category }
  })

  const levels = fallback.levels.map((level) => {
    const existing = summary.levels.find((item) => item.level === level.level)
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
  async fetchAuthors(params: {
    offset?: number
    limit?: number
    search?: string
    verified?: boolean
    sortBy?: AuthorSortField
    sortOrder?: AuthorSortOrder
  } = {}): Promise<AuthorListResponse> {
    try {
      const query = buildQueryString({
        offset: params.offset,
        limit: params.limit,
        search: params.search,
        verified: params.verified,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })
      const url = query ? `${API_URL}/authors?${query}` : `${API_URL}/authors`
      const response = await fetch(url)

      const data = await handleResponse<AuthorsListResponse>(response, 'Не удалось загрузить список авторов')
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
      const response = await fetch(`${API_URL}/authors/${vkUserId}`)
      const data = await handleResponse<AuthorDetailsResponse>(response, 'Не удалось загрузить данные пользователя')
      return mapAuthorDetails(data)
    } catch (error) {
      toast.error('Не удалось загрузить данные пользователя')
      throw error
    }
  },

  async refreshAuthors(): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/authors/refresh`, {
        method: 'POST',
      })

      const result = await handleResponse<RefreshAuthorsResponse>(response, 'Не удалось обновить карточки авторов')
      toast.success('Карточки авторов обновлены')
      return result.updated
    } catch (error) {
      toast.error('Не удалось обновить авторов')
      throw error
    }
  },
}
