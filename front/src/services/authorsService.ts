import toast from 'react-hot-toast'
import { authorsApi } from '../api/authorsApi'
import { createEmptyPhotoAnalysisSummary } from '../types'
import type {
  AuthorCard,
  AuthorDetails,
  AuthorListResponse,
  PhotoAnalysisSummary,
} from '../types'
import type {
  AuthorCardResponse,
  AuthorDetailsResponse,
} from '../types/api'

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
  } = {}): Promise<AuthorListResponse> {
    try {
      const response = await authorsApi.fetchAuthors(params)
      return {
        items: response.items.map(mapAuthorCard),
        total: response.total,
        hasMore: response.hasMore,
      }
    } catch (error) {
      toast.error('Ошибка загрузки авторов')
      throw error
    }
  },

  async getAuthorDetails(vkUserId: number): Promise<AuthorDetails> {
    try {
      const response = await authorsApi.getDetails(vkUserId)
      return mapAuthorDetails(response)
    } catch (error) {
      toast.error('Не удалось загрузить данные пользователя')
      throw error
    }
  },

  async refreshAuthors(): Promise<number> {
    try {
      const result = await authorsApi.refreshAuthors()
      toast.success('Карточки авторов обновлены')
      return result.updated
    } catch (error) {
      toast.error('Не удалось обновить авторов')
      throw error
    }
  },
}
