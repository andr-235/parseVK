import type { ReactNode } from 'react'

export interface Keyword {
  id: number
  word: string
  category?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Comment {
  id: number
  author: string
  authorId?: string | null
  authorUrl?: string | null
  authorAvatar?: string | null
  commentUrl?: string | null
  text: string
  createdAt: string
  publishedAt?: string | null
  isRead: boolean
  watchlistAuthorId?: number | null
  isWatchlisted: boolean
}

export interface Group {
  id: number
  vkId: number
  name: string
  screenName?: string
  isClosed?: number
  deactivated?: string
  type?: string
  photo50?: string
  photo100?: string
  photo200?: string
  activity?: string
  ageLimits?: number
  description?: string
  membersCount?: number
  status?: string
  verified?: number
  wall?: number
  addresses?: Record<string, unknown> | null
  city?: { id?: number; title?: string; name?: string } | string | null
  counters?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export type TableSortDirection = 'asc' | 'desc'

export type TableSortValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined

export interface TableSortState {
  key: string
  direction: TableSortDirection
}

export interface TableColumn<T = any> {
  header: string
  key: string
  render?: (item: T, index: number) => ReactNode
  sortable?: boolean
  sortValue?: (item: T) => TableSortValue
  emptyValue?: ReactNode
  expandable?: boolean
  truncateAt?: number
  headerClassName?: string
  cellClassName?: string
}

export type TaskStatus = 'pending' | 'processing' | 'running' | 'completed' | 'failed'

export interface TaskStatsInfo {
  groups?: number
  success?: number
  failed?: number
  processing?: number
  running?: number
  pending?: number
  processed?: number
  posts?: number
  comments?: number
  authors?: number
}

export interface Task {
  id: number | string
  status: TaskStatus
  createdAt: string
  completedAt?: string | null
  groupsCount: number
  successCount?: number | null
  failedCount?: number | null
  title?: string | null
  scope?: 'ALL' | 'SELECTED' | string | null
  skippedGroupsMessage?: string | null
  postLimit?: number | null
  groupIds?: Array<number | string> | null
  stats?: TaskStatsInfo
}

export interface TaskDetails extends Task {
  groups: {
    groupId: number | string
    groupName: string
    status: 'pending' | 'processing' | 'running' | 'success' | 'failed'
    error?: string | null
    parsedData?: Record<string, unknown> | null
    progressPercent?: number | null
    processedCount?: number | null
    totalCount?: number | null
    currentIndex?: number | null
    remainingCount?: number | null
  }[]
}

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

export interface AuthorProfile {
  id: number
  vkUserId: number
  firstName: string
  lastName: string
  fullName: string
  deactivated: string | null
  isClosed: boolean | null
  domain: string | null
  screenName: string | null
  avatar: string | null
  profileUrl: string
}

export interface AuthorStats {
  followersCount: number | null
  counters: Record<string, number | null> | null
}

export interface AuthorLocation {
  id?: number
  title?: string
}

export interface AuthorLastSeen {
  time?: number | null
  platform?: number | null
}

export interface AuthorDetails {
  about: string | null
  activities: string | null
  interests: string | null
  music: string | null
  movies: string | null
  books: string | null
  tv: string | null
  status: string | null
  site: string | null
  bdate: string | null
  homeTown: string | null
  nickname: string | null
  maidenName: string | null
  relation: number | null
  sex: number | null
  timezone: number | null
  education: Record<string, unknown> | null
  occupation: Record<string, unknown> | null
  personal: Record<string, unknown> | null
  career: Array<Record<string, unknown>> | null
  military: Array<Record<string, unknown>> | null
  relatives: Array<Record<string, unknown>> | null
  schools: Array<Record<string, unknown>> | null
  universities: Array<Record<string, unknown>> | null
  contacts: Record<string, string> | null
  connections: Record<string, string> | null
  lastSeen: AuthorLastSeen | null
  city: AuthorLocation | null
  country: AuthorLocation | null
}

export interface AuthorCard {
  id: number
  createdAt: string
  updatedAt: string
  profile: AuthorProfile
  stats: AuthorStats
  details: AuthorDetails
}
