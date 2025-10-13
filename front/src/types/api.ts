import type { TaskStatus } from './index'

export interface IGroupResponse {
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
  addresses?: any
  city?: any
  counters?: any
  createdAt: string
  updatedAt: string
}

export interface IDeleteResponse {
  count: number
}

export interface IKeywordResponse {
  id: number
  word: string
  createdAt?: string
  updatedAt?: string
}

export interface IBulkAddResponse {
  successCount: number
  failed: { word?: string; error: string }[]
}

export interface ICommentAuthorResponse {
  id?: number
  vkUserId?: number | string | null
  firstName?: string | null
  lastName?: string | null
  domain?: string | null
  screenName?: string | null
  fullName?: string | null
  full_name?: string | null
  name?: string | null
  displayName?: string | null
  display_name?: string | null
  nickname?: string | null
  first_name?: string | null
  last_name?: string | null
  screen_name?: string | null
  logo?: string | null
  avatar?: string | null
  photo?: string | null
  photoUrl?: string | null
  photo_url?: string | null
  photoMax?: string | null
  photo_max?: string | null
  photo200?: string | null
  photo_200?: string | null
}

export interface ICommentResponse {
  id: number
  postId?: number
  ownerId?: number
  vkCommentId?: number
  fromId?: number | string | null
  authorVkId?: number | string | null
  author?: string | ICommentAuthorResponse | null
  authorName?: string | null
  text: string | null
  createdAt: string
  updatedAt?: string
  publishedAt?: string
  likesCount?: number
  parentsStack?: Array<number | string>
  threadCount?: number | null
  threadItems?: unknown
  replyToUser?: number | string | null
  replyToComment?: number | string | null
  attachments?: unknown
  isDeleted?: boolean
  isRead?: boolean
  watchlistAuthorId?: number | null
  source?: 'TASK' | 'WATCHLIST'
}

export interface IGetCommentsResponse {
  items: ICommentResponse[]
  total: number
  hasMore: boolean
}

export interface IParsingTaskGroup {
  groupId: number | string
  groupName: string
  status: 'pending' | 'processing' | 'running' | 'success' | 'failed'
  error?: string | null
  parsedData?: Record<string, unknown> | null
  [key: string]: unknown
}

export interface IParsingTaskStats {
  groups?: number
  success?: number
  failed?: number
  processed?: number
  posts?: number
  comments?: number
  authors?: number
  [key: string]: unknown
}

export interface IParsingTaskDescription {
  groupIds?: Array<number | string>
  stats?: IParsingTaskStats | null
  [key: string]: unknown
}

export interface IParsingTaskSummary {
  id: number | string
  createdAt: string
  status?: TaskStatus | string | null
  completedAt?: string | null
  updatedAt?: string | null
  groupsCount?: number
  successCount?: number
  failedCount?: number
  totalItems?: number | string | null
  processedItems?: number | string | null
  progress?: number | string | null
  title?: string | null
  description?: string | IParsingTaskDescription | null
  stats?: IParsingTaskStats | null
  completed?: boolean | null
  state?: string | null
  scope?: string | null
  groupIds?: Array<number | string>
  postLimit?: number | null
  skippedGroupsMessage?: string | null
  [key: string]: unknown
}

export interface IParsingTaskResult extends IParsingTaskSummary {
  groups?: IParsingTaskGroup[] | null
  [key: string]: unknown
}

export interface IWatchlistAuthorProfileResponse {
  vkUserId: number
  firstName: string
  lastName: string
  fullName: string
  avatar: string | null
  screenName: string | null
  domain: string | null
  profileUrl: string | null
}

export type WatchlistStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED'

export interface IWatchlistAuthorResponse {
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
  author: IWatchlistAuthorProfileResponse
}

export interface IWatchlistAuthorListResponse {
  items: IWatchlistAuthorResponse[]
  total: number
  hasMore: boolean
}

export interface IWatchlistCommentResponse {
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

export interface IWatchlistCommentsListResponse {
  items: IWatchlistCommentResponse[]
  total: number
  hasMore: boolean
}

export interface IWatchlistAuthorDetailsResponse extends IWatchlistAuthorResponse {
  comments: IWatchlistCommentsListResponse
}

export interface IWatchlistSettingsResponse {
  id: number
  trackAllComments: boolean
  pollIntervalMinutes: number
  maxAuthors: number
  createdAt: string
  updatedAt: string
}
