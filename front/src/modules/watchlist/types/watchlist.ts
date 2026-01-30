import type { PhotoAnalysisSummary } from '@/modules/authorAnalysis/types'
import type { TableColumn } from '@/shared/types'

export type WatchlistStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED'

export interface WatchlistAuthorProfile {
  vkUserId: number
  firstName: string
  lastName: string
  fullName: string
  avatar: string | null
  profileUrl: string | null
  screenName: string | null
  domain: string | null
}

export interface WatchlistAuthorCard {
  id: number
  authorVkId: number
  status: WatchlistStatus
  lastCheckedAt: string | null
  lastActivityAt: string | null
  foundCommentsCount: number
  totalComments: number
  monitoringStartedAt: string
  monitoringStoppedAt: string | null
  settingsId: number
  author: WatchlistAuthorProfile
  analysisSummary: PhotoAnalysisSummary
}

export interface WatchlistComment {
  id: number
  ownerId: number
  postId: number
  vkCommentId: number
  text: string | null
  publishedAt: string | null
  createdAt: string
  source: 'TASK' | 'WATCHLIST'
  commentUrl: string | null
}

export interface WatchlistAuthorDetails extends WatchlistAuthorCard {
  comments: {
    items: WatchlistComment[]
    total: number
    hasMore: boolean
  }
}

export interface WatchlistSettings {
  id: number
  trackAllComments: boolean
  pollIntervalMinutes: number
  maxAuthors: number
  createdAt: string
  updatedAt: string
}

// Типы специфичные для watchlist
export interface WatchlistAuthorColumnsProps {
  handleSelectAuthor: (id: number) => void
  handleRemoveFromWatchlist: (id: number) => void
  pendingRemoval: Record<number, boolean>
}

export interface WatchlistHeroProps {
  settings: WatchlistSettings | null
  totalAuthors: number
  isLoadingAuthors: boolean
  isUpdatingSettings: boolean
  onRefresh: () => void
  onToggleTrackAll: () => void
}

export interface WatchlistAuthorsTableProps {
  authors: WatchlistAuthorCard[]
  totalAuthors: number
  hasMoreAuthors: boolean
  isLoadingAuthors: boolean
  isLoadingMoreAuthors: boolean
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  onSelectAuthor: (id: number) => void
  onLoadMore: () => void
}

export interface WatchlistAuthorDetailsProps {
  currentAuthor: WatchlistAuthorDetails | null
  isLoadingAuthorDetails: boolean
  commentColumns: TableColumn<WatchlistComment>[]
}
