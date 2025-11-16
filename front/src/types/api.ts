import type { PhotoAnalysisSummary, TaskStatus } from './index'

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
  addresses?: Record<string, unknown> | null
  city?: { id?: number; title?: string; name?: string } | string | null
  counters?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface IGroupsListResponse {
  items: IGroupResponse[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface IRegionGroupSearchItem {
  id: number
  name: string
  screen_name?: string
  is_closed?: number
  deactivated?: string
  type?: string
  photo_50?: string
  photo_100?: string
  photo_200?: string
  activity?: string
  age_limits?: number
  description?: string
  members_count?: number
  status?: string
  verified?: number
  wall?: number
  addresses?: Record<string, unknown> | null
  city?: { id?: number; title?: string; name?: string } | string | null
  counters?: Record<string, unknown> | null
  existsInDb: boolean
}

export interface IRegionGroupSearchResponse {
  total: number
  groups: IRegionGroupSearchItem[]
  existsInDb: IRegionGroupSearchItem[]
  missing: IRegionGroupSearchItem[]
}

export interface IDeleteResponse {
  count: number
}

export interface IKeywordResponse {
  id: number
  word: string
  category?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface IBulkAddResponse {
  success: IKeywordResponse[]
  failed: { word: string; error: string }[]
  total: number
  successCount: number
  failedCount: number
  createdCount: number
  updatedCount: number
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
  matchedKeywords?: IKeywordResponse[]
}

export interface IGetCommentsResponse {
  items: ICommentResponse[]
  total: number
  hasMore: boolean
  readCount: number
  unreadCount: number
}

export interface IGetCommentsCursorResponse {
  items: ICommentResponse[]
  nextCursor: string | null
  hasMore: boolean
  total: number
  readCount: number
  unreadCount: number
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

export interface IListing {
  id: number
  source?: string | null
  externalId?: string | null
  title?: string | null
  description?: string | null
  url: string
  price?: number | null
  currency?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  rooms?: number | null
  areaTotal?: number | null
  areaLiving?: number | null
  areaKitchen?: number | null
  floor?: number | null
  floorsTotal?: number | null
  publishedAt?: string | null
  contactName?: string | null
  contactPhone?: string | null
  images: string[]
  sourceAuthorName?: string | null
  sourceAuthorPhone?: string | null
  sourceAuthorUrl?: string | null
  sourcePostedAt?: string | null
  sourceParsedAt?: string | null
  manualOverrides?: string[]
  manualNote?: string | null
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface IListingsResponse {
  items: IListing[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  sources: string[]
}

export interface ListingImportItem {
  url: string
  source?: string | null
  externalId?: string | null
  title?: string | null
  description?: string | null
  price?: string | number | null
  currency?: string | null
  address?: string | null
  city?: string | null
  latitude?: string | number | null
  longitude?: string | number | null
  rooms?: string | number | null
  areaTotal?: string | number | null
  areaLiving?: string | number | null
  areaKitchen?: string | number | null
  floor?: string | number | null
  floorsTotal?: string | number | null
  publishedAt?: string | null
  contactName?: string | null
  contactPhone?: string | null
  images?: string[]
  sourceAuthorName?: string | null
  sourceAuthorPhone?: string | null
  sourceAuthorUrl?: string | null
  sourcePostedAt?: string | null
  sourceParsedAt?: string | null
  metadata?: Record<string, unknown> | null
}

export interface ListingImportRequest {
  listings: ListingImportItem[]
  updateExisting?: boolean
}

export interface ListingImportError {
  index: number
  url?: string
  message: string
}

export interface ListingImportReport {
  processed: number
  created: number
  updated: number
  skipped: number
  failed: number
  errors: ListingImportError[]
}

export interface ListingUpdatePayload {
  source?: string | null
  externalId?: string | null
  title?: string | null
  description?: string | null
  url?: string | null
  price?: number | null
  currency?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  rooms?: number | null
  areaTotal?: number | null
  areaLiving?: number | null
  areaKitchen?: number | null
  floor?: number | null
  floorsTotal?: number | null
  publishedAt?: string | null
  contactName?: string | null
  contactPhone?: string | null
  images?: string[] | null
  sourceAuthorName?: string | null
  sourceAuthorPhone?: string | null
  sourceAuthorUrl?: string | null
  sourcePostedAt?: string | null
  sourceParsedAt?: string | null
  manualNote?: string | null
  archived?: boolean | null
}

export interface ITaskAutomationSettings {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
  lastRunAt: string | null
  nextRunAt: string | null
  isRunning: boolean
}

export interface ITaskAutomationRunResponse {
  started: boolean
  reason: string | null
  settings: ITaskAutomationSettings
}

export interface AuthorCardResponse {
  id: number
  vkUserId: number
  firstName: string
  lastName: string
  fullName: string
  photo50: string | null
  photo100: string | null
  photo200: string | null
  domain: string | null
  screenName: string | null
  profileUrl: string | null
  summary: PhotoAnalysisSummary
  photosCount: number | null
  audiosCount: number | null
  videosCount: number | null
  friendsCount: number | null
  followersCount: number | null
  lastSeenAt: string | null
  verifiedAt: string | null
  isVerified: boolean
}

export interface AuthorDetailsResponse extends AuthorCardResponse {
  city: Record<string, unknown> | null
  country: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface AuthorsListResponse {
  items: AuthorCardResponse[]
  total: number
  hasMore: boolean
}

export interface RefreshAuthorsResponse {
  updated: number
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
  analysisSummary: PhotoAnalysisSummary
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

export type TelegramChatType = 'PRIVATE' | 'GROUP' | 'SUPERGROUP' | 'CHANNEL'

export type TelegramMemberStatus = 'CREATOR' | 'ADMINISTRATOR' | 'MEMBER' | 'RESTRICTED' | 'LEFT' | 'KICKED'

export interface TelegramMember {
  userId: number
  telegramId: string
  firstName: string | null
  lastName: string | null
  username: string | null
  phoneNumber: string | null
  status: TelegramMemberStatus
  isAdmin: boolean
  isOwner: boolean
  joinedAt: string | null
  leftAt: string | null
}

export interface TelegramSyncResponse {
  chatId: number
  telegramId: string
  type: TelegramChatType
  title: string | null
  username: string | null
  syncedMembers: number
  totalMembers: number | null
  fetchedMembers: number
  members: TelegramMember[]
}

export interface TelegramSyncRequest {
  identifier: string
  limit?: number
}

export interface TelegramSessionStartRequest {
  phoneNumber?: string
  apiId?: number
  apiHash?: string
}

export interface TelegramSessionStartResponse {
  transactionId: string
  codeLength: number
  nextType: 'app' | 'sms' | 'call' | 'flash'
  timeoutSec: number | null
}

export interface TelegramSessionConfirmRequest {
  transactionId: string
  code: string
  password?: string
}

export interface TelegramSessionConfirmResponse {
  session: string
  expiresAt: string | null
  userId: number
  username: string | null
  phoneNumber: string | null
}

export interface TelegramSettings {
  phoneNumber: string | null
  apiId: number | null
  apiHash: string | null
  createdAt: string
  updatedAt: string
}

export interface TelegramSettingsRequest {
  phoneNumber?: string | null
  apiId?: number | null
  apiHash?: string | null
}
