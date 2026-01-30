import type { AuthorCard, AuthorSortField, AuthorSortOrder } from '@/modules/authors/types'
import type { Comment, Group, Keyword, Task, TaskDetails } from './common'
import type { IBulkAddResponse, IRegionGroupSearchItem } from './api'
// Navigation Store Types
export type Page =
  | 'tasks'
  | 'groups'
  | 'listings'
  | 'comments'
  | 'keywords'
  | 'watchlist'
  | 'authors'

export interface NavigationState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
}

// Comments Store Types
export interface CommentsFilters {
  keywords?: string[]
  keywordSource?: 'COMMENT' | 'POST'
  readStatus?: 'all' | 'unread' | 'read'
  search?: string
}

export interface CommentsState {
  comments: Comment[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  totalCount: number
  nextCursor: string | null
  readCount: number
  unreadCount: number
  filters: CommentsFilters
  fetchComments: (options?: {
    reset?: boolean
    limit?: number
    filters?: CommentsFilters
  }) => Promise<void>
  fetchCommentsCursor: (options?: {
    reset?: boolean
    limit?: number
    filters?: CommentsFilters
  }) => Promise<void>
  toggleReadStatus: (id: number) => Promise<void>
  markWatchlisted: (commentId: number, watchlistAuthorId: number) => void
}

// Keywords Store Types
export interface KeywordsState {
  keywords: Keyword[]
  isLoading: boolean
  fetchKeywords: () => Promise<void>
  addKeyword: (word: string, category?: string, isPhrase?: boolean) => Promise<boolean>
  deleteKeyword: (id: number) => Promise<void>
  loadFromFile: (file: File) => Promise<IBulkAddResponse>
  deleteAllKeywords: () => Promise<void>
}

// Groups Store Types
export interface RegionGroupsSearchState {
  total: number
  items: IRegionGroupSearchItem[]
  missing: IRegionGroupSearchItem[]
  existsInDb: IRegionGroupSearchItem[]
  isLoading: boolean
  error: string | null
}

export interface GroupsState {
  groups: Group[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  isLoading: boolean
  isProcessing: boolean
  isLoadingMore: boolean
  fetchGroups: (options?: { reset?: boolean }) => Promise<void>
  loadMoreGroups: () => Promise<void>
  fetchAllGroups: () => Promise<void>
  addGroup: (url: string, description?: string, options?: { silent?: boolean }) => Promise<boolean>
  deleteGroup: (id: number) => Promise<void>
  loadFromFile: (file: File) => Promise<{ saved: number; errors: string[] }>
  deleteAllGroups: () => Promise<void>
  regionSearch: RegionGroupsSearchState
  searchRegionGroups: () => Promise<void>
  addGroupFromRegionSearch: (group: IRegionGroupSearchItem) => Promise<boolean>
  addSelectedRegionSearchGroups: (groups: IRegionGroupSearchItem[]) => Promise<{
    successCount: number
    failedIds: number[]
  }>
  removeRegionSearchGroup: (vkGroupId: number) => void
  resetRegionSearch: () => void
}

// Tasks Store Types
export interface TasksState {
  tasks: Task[]
  taskDetails: Record<string, TaskDetails>
  /** Порядок идентификаторов задач в нормализованном состоянии. */
  taskIds: Array<number | string>
  /** Нормализованное хранилище задач по идентификатору. */
  tasksById: Record<string, Task>
  isLoading: boolean
  isCreating: boolean
  /** Признак активного WebSocket-соединения для задач. */
  isSocketConnected: boolean
  fetchTasks: () => Promise<void>
  createParseTask: (groupIds: Array<number | string>) => Promise<number | string | null>
  fetchTaskDetails: (taskId: number | string) => Promise<TaskDetails | null>
  getTaskDetails: (taskId: number | string) => TaskDetails | undefined
  resumeTask: (taskId: number | string) => Promise<boolean>
  checkTask: (taskId: number | string) => Promise<boolean>
  deleteTask: (taskId: number | string) => Promise<boolean>
}

export interface AuthorsState {
  authors: AuthorCard[]
  total: number
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshing: boolean
  search: string
  cityFilter: string
  statusFilter: 'all' | 'verified' | 'unverified'
  pageSize: number
  sortBy: AuthorSortField | null
  sortOrder: AuthorSortOrder
  fetchAuthors: (options?: { search?: string; reset?: boolean }) => Promise<void>
  loadMore: () => Promise<void>
  setSearch: (value: string) => void
  setCityFilter: (value: string) => void
  setStatusFilter: (value: 'all' | 'verified' | 'unverified') => void
  setSort: (value: AuthorSortField) => void
  markAuthorVerified: (vkUserId: number, verifiedAt: string | null) => void
  verifyAuthor: (vkUserId: number) => Promise<string>
  refreshAuthors: () => Promise<void>
  deleteAuthor: (vkUserId: number) => Promise<void>
}
