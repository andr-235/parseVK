import { create } from 'zustand'
import { watchlistApi } from '../api/watchlistApi'
import type {
  IWatchlistAuthorDetailsResponse,
  IWatchlistAuthorResponse,
  IWatchlistCommentResponse,
  IWatchlistSettingsResponse,
} from '../types/api'
import type {
  WatchlistAuthorCard,
  WatchlistAuthorDetails,
  WatchlistComment,
  WatchlistSettings,
  WatchlistStatus,
  PhotoAnalysisSummary,
} from '../types'
import { createEmptyPhotoAnalysisSummary } from '../types'

const cloneSummary = (summary: PhotoAnalysisSummary): PhotoAnalysisSummary => ({
  total: summary.total,
  suspicious: summary.suspicious,
  lastAnalyzedAt: summary.lastAnalyzedAt,
  categories: summary.categories.map((item) => ({ ...item })),
  levels: summary.levels.map((item) => ({ ...item })),
})

const mapAuthor = (author: IWatchlistAuthorResponse): WatchlistAuthorCard => ({
  id: author.id,
  authorVkId: author.authorVkId,
  status: author.status,
  lastCheckedAt: author.lastCheckedAt,
  lastActivityAt: author.lastActivityAt,
  foundCommentsCount: author.foundCommentsCount,
  totalComments: author.totalComments,
  monitoringStartedAt: author.monitoringStartedAt,
  monitoringStoppedAt: author.monitoringStoppedAt,
  settingsId: author.settingsId,
  author: {
    vkUserId: author.author.vkUserId,
    firstName: author.author.firstName,
    lastName: author.author.lastName,
    fullName: author.author.fullName,
    avatar: author.author.avatar,
    profileUrl: author.author.profileUrl,
    screenName: author.author.screenName,
    domain: author.author.domain,
  },
  analysisSummary: cloneSummary(
    author.analysisSummary ?? createEmptyPhotoAnalysisSummary(),
  ),
})

const mapComment = (comment: IWatchlistCommentResponse): WatchlistComment => ({
  id: comment.id,
  ownerId: comment.ownerId,
  postId: comment.postId,
  vkCommentId: comment.vkCommentId,
  text: comment.text,
  publishedAt: comment.publishedAt,
  createdAt: comment.createdAt,
  source: comment.source,
  commentUrl: comment.commentUrl,
})

const mapDetails = (details: IWatchlistAuthorDetailsResponse): WatchlistAuthorDetails => ({
  ...mapAuthor(details),
  comments: {
    items: details.comments.items.map(mapComment),
    total: details.comments.total,
    hasMore: details.comments.hasMore,
  },
})

const mapSettings = (settings: IWatchlistSettingsResponse): WatchlistSettings => ({
  id: settings.id,
  trackAllComments: settings.trackAllComments,
  pollIntervalMinutes: settings.pollIntervalMinutes,
  maxAuthors: settings.maxAuthors,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
})

interface WatchlistState {
  authors: WatchlistAuthorCard[]
  totalAuthors: number
  hasMoreAuthors: boolean
  isLoadingAuthors: boolean
  isLoadingMoreAuthors: boolean
  isCreatingAuthor: boolean
  selectedAuthor: WatchlistAuthorDetails | null
  isLoadingAuthorDetails: boolean
  settings: WatchlistSettings | null
  isLoadingSettings: boolean
  isUpdatingSettings: boolean
  error: string | null
  fetchAuthors: (options?: { reset?: boolean; limit?: number }) => Promise<void>
  fetchAuthorDetails: (id: number, options?: { offset?: number; limit?: number }) => Promise<void>
  addAuthorFromComment: (payload: { commentId: number }) => Promise<WatchlistAuthorCard>
  updateAuthorStatus: (id: number, status: WatchlistStatus) => Promise<WatchlistAuthorCard>
  fetchSettings: () => Promise<void>
  updateSettings: (payload: Partial<WatchlistSettings>) => Promise<WatchlistSettings>
  clearError: () => void
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  authors: [],
  totalAuthors: 0,
  hasMoreAuthors: false,
  isLoadingAuthors: false,
  isLoadingMoreAuthors: false,
  isCreatingAuthor: false,
  selectedAuthor: null,
  isLoadingAuthorDetails: false,
  settings: null,
  isLoadingSettings: false,
  isUpdatingSettings: false,
  error: null,

  clearError() {
    set({ error: null })
  },

  async fetchAuthors({ reset = false, limit }: { reset?: boolean; limit?: number } = {}) {
    const state = get()

    if (state.isLoadingAuthors || state.isLoadingMoreAuthors) {
      return
    }

    const offset = reset ? 0 : state.authors.length

    if (!reset && !state.hasMoreAuthors) {
      return
    }

    if (reset) {
      set({ isLoadingAuthors: true })
    } else {
      set({ isLoadingMoreAuthors: true })
    }

    try {
      const response = await watchlistApi.getAuthors({ offset, limit })
      const mapped = response.items.map(mapAuthor)

      set((prev) => ({
        authors: reset ? mapped : [...prev.authors, ...mapped.filter((author) => !prev.authors.some((existing) => existing.id === author.id))],
        totalAuthors: response.total,
        hasMoreAuthors: response.hasMore,
        isLoadingAuthors: false,
        isLoadingMoreAuthors: false,
        error: null,
      }))
    } catch (error) {
      console.error('Не удалось загрузить список авторов "На карандаше"', error)
      set({ isLoadingAuthors: false, isLoadingMoreAuthors: false, error: 'Не удалось загрузить список авторов' })
      throw error
    }
  },

  async fetchAuthorDetails(id, options) {
    set({ isLoadingAuthorDetails: true })

    try {
      const response = await watchlistApi.getAuthorDetails(id, options)
      const mapped = mapDetails(response)

      set({ selectedAuthor: mapped, isLoadingAuthorDetails: false, error: null })
    } catch (error) {
      console.error('Не удалось загрузить детали автора', error)
      set({ isLoadingAuthorDetails: false, error: 'Не удалось загрузить детали автора' })
      throw error
    }
  },

  async addAuthorFromComment(payload) {
    if (get().isCreatingAuthor) {
      throw new Error('Запрос уже выполняется')
    }

    set({ isCreatingAuthor: true })

    try {
      const response = await watchlistApi.createAuthor(payload)
      const mapped = mapAuthor(response)

      set((prev) => ({
        authors: [mapped, ...prev.authors.filter((author) => author.id !== mapped.id)],
        totalAuthors: prev.totalAuthors + (prev.authors.some((author) => author.id === mapped.id) ? 0 : 1),
        isCreatingAuthor: false,
        error: null,
      }))

      return mapped
    } catch (error) {
      console.error('Не удалось добавить автора', error)
      set({ isCreatingAuthor: false, error: 'Не удалось добавить автора' })
      throw error
    }
  },

  async updateAuthorStatus(id, status) {
    try {
      const response = await watchlistApi.updateAuthor(id, { status })
      const mapped = mapAuthor(response)

      set((prev) => ({
        authors: prev.authors.map((author) => (author.id === id ? mapped : author)),
        selectedAuthor:
          prev.selectedAuthor && prev.selectedAuthor.id === id
            ? {
                ...prev.selectedAuthor,
                ...mapped,
                comments: prev.selectedAuthor.comments,
              }
            : prev.selectedAuthor,
        error: null,
      }))

      return mapped
    } catch (error) {
      console.error('Не удалось обновить статус автора', error)
      set({ error: 'Не удалось обновить статус автора' })
      throw error
    }
  },

  async fetchSettings() {
    set({ isLoadingSettings: true })

    try {
      const response = await watchlistApi.getSettings()
      set({ settings: mapSettings(response), isLoadingSettings: false, error: null })
    } catch (error) {
      console.error('Не удалось загрузить настройки мониторинга', error)
      set({ isLoadingSettings: false, error: 'Не удалось загрузить настройки мониторинга' })
      throw error
    }
  },

  async updateSettings(payload) {
    set({ isUpdatingSettings: true })

    try {
      const response = await watchlistApi.updateSettings(payload)
      const mapped = mapSettings(response)
      set({ settings: mapped, isUpdatingSettings: false, error: null })
      return mapped
    } catch (error) {
      console.error('Не удалось обновить настройки мониторинга', error)
      set({ isUpdatingSettings: false, error: 'Не удалось обновить настройки мониторинга' })
      throw error
    }
  },
}))
