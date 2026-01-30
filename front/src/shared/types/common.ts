import type { ReactNode } from 'react'

export interface Keyword {
  id: number
  word: string
  category?: string | null
  isPhrase?: boolean
  source?: 'COMMENT' | 'POST'
  createdAt?: string
  updatedAt?: string
}

export interface PostGroup {
  id: number
  vkId: number
  name: string
  screenName: string | null
  photo: string | null
}

export interface ThreadItem {
  vkCommentId: number
  fromId: number
  text: string
  publishedAt: string
  likesCount?: number | null
  threadItems?: ThreadItem[]
  replyToComment?: number | null
  replyToUser?: number | null
  attachments?: unknown
  author?: {
    vkUserId: number
    firstName: string
    lastName: string
    logo: string | null
  } | null
}

export interface Comment {
  id: number
  author: string
  authorId?: string | null
  authorUrl?: string | null
  authorAvatar?: string | null
  commentUrl?: string | null
  text: string
  postText?: string | null
  postAttachments?: unknown | null
  postGroup?: PostGroup | null
  createdAt: string
  publishedAt?: string | null
  isRead: boolean
  isDeleted?: boolean
  watchlistAuthorId?: number | null
  isWatchlisted: boolean
  matchedKeywords: Keyword[]
  threadCount?: number | null
  threadItems?: ThreadItem[]
  replyToComment?: number | null
  replyToUser?: number | null
  attachments?: unknown
  likesCount?: number | null
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

export type TableSortValue = string | number | boolean | Date | null | undefined

export interface TableSortState {
  key: string
  direction: TableSortDirection
}

export interface TableColumn<T = unknown> {
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
  processedItems?: number | null
  totalItems?: number | null
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

export interface TaskAutomationSettings {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
  lastRunAt: string | null
  nextRunAt: string | null
  isRunning: boolean
}
