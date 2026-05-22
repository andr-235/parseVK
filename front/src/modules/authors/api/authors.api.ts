import toast from 'react-hot-toast'
import { API_URL, GATEWAY_API_URL } from '@/shared/api'
import { buildQueryString, createRequest, handleResponse } from '@/shared/api'
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
} from '@/shared/types'

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

type ContentPageDto<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

type ContentAuthorDto = {
  id: number
  vkAuthorId: number
  type?: string | null
  displayName?: string | null
  updatedAt?: string | null
}

const CONTENT_AUTHORS_API_URL = `${GATEWAY_API_URL}/v1/content/authors`

const hasLegacyOnlyAuthorFilters = (params: {
  search?: string
  city?: string
  verified?: boolean
  sortBy?: AuthorSortField
  sortOrder?: AuthorSortOrder
}): boolean =>
  Boolean(
    params.search?.trim() ||
      params.city?.trim() ||
      params.verified !== undefined ||
      params.sortBy ||
      params.sortOrder
  )

const offsetToPage = (offset = 0, limit = 20): number => Math.floor(offset / limit) + 1

const splitDisplayName = (displayName: string): { firstName: string; lastName: string } => {
  const [firstName = '', ...rest] = displayName.trim().split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

const mapContentAuthor = (author: ContentAuthorDto): AuthorDetailsResponse => {
  const displayName = author.displayName?.trim() || `VK ${author.vkAuthorId}`
  const { firstName, lastName } = splitDisplayName(displayName)
  const updatedAt = author.updatedAt ?? new Date(0).toISOString()

  return {
    id: author.id,
    vkUserId: author.vkAuthorId,
    firstName,
    lastName,
    fullName: displayName,
    photo50: null,
    photo100: null,
    photo200: null,
    domain: null,
    screenName: null,
    profileUrl: `https://vk.com/id${author.vkAuthorId}`,
    city: null,
    country: null,
    summary: createEmptyPhotoAnalysisSummary(),
    photosCount: null,
    audiosCount: null,
    videosCount: null,
    friendsCount: null,
    followersCount: null,
    lastSeenAt: null,
    verifiedAt: null,
    isVerified: false,
    createdAt: updatedAt,
    updatedAt,
  }
}

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
      if (!hasLegacyOnlyAuthorFilters(params)) {
        const limit = params.limit ?? 20
        const page = offsetToPage(params.offset, limit)
        const response = await createRequest(`${CONTENT_AUTHORS_API_URL}?page=${page}&limit=${limit}`)
        const data = await handleResponse<ContentPageDto<ContentAuthorDto>>(
          response,
          'Failed to fetch authors'
        )

        return {
          items: data.items.map((author) => mapAuthorCard(mapContentAuthor(author))),
          total: data.total,
          hasMore: data.hasMore,
        }
      }

      const query = buildQueryString({
        offset: params.offset,
        limit: params.limit,
        search: params.search,
        city: params.city,
        verified: params.verified,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })
      const url = query ? `${API_URL}/authors?${query}` : `${API_URL}/authors`
      const response = await createRequest(url)

      const data = await handleResponse<AuthorsListResponse>(
        response,
        'Не удалось загрузить список авторов'
      )
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
      const response = await createRequest(`${CONTENT_AUTHORS_API_URL}/${vkUserId}`)
      const data = await handleResponse<ContentAuthorDto>(
        response,
        'Не удалось загрузить данные пользователя'
      )
      return mapAuthorDetails(mapContentAuthor(data))
    } catch (error) {
      toast.error('Не удалось загрузить данные пользователя')
      throw error
    }
  },

  async refreshAuthors(): Promise<number> {
    try {
      const response = await createRequest(`${API_URL}/authors/refresh`, {
        method: 'POST',
      })

      const result = await handleResponse<RefreshAuthorsResponse>(
        response,
        'Не удалось обновить карточки авторов'
      )
      toast.success('Карточки авторов обновлены')
      return result.updated
    } catch (error) {
      toast.error('Не удалось обновить авторов')
      throw error
    }
  },
  async deleteAuthor(vkUserId: number): Promise<void> {
    try {
      const response = await createRequest(`${API_URL}/authors/${vkUserId}`, {
        method: 'DELETE',
      })

      await handleResponse<{ deleted: boolean }>(response, 'Не удалось удалить автора')
    } catch (error) {
      toast.error('Не удалось удалить автора')
      throw error
    }
  },
  async verifyAuthor(vkUserId: number): Promise<string> {
    try {
      const response = await createRequest(`${API_URL}/authors/${vkUserId}/verify`, {
        method: 'PATCH',
        keepalive: true,
      })

      const data = await handleResponse<{ verifiedAt: string }>(
        response,
        'Не удалось отметить автора как проверенного'
      )
      return data.verifiedAt
    } catch (error) {
      toast.error('Не удалось отметить автора как проверенного')
      throw error
    }
  },
}
