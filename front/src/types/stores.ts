import type {
  AuthorCard,
  AuthorSortField,
  AuthorSortOrder,
  Comment,
  Keyword,
  Group,
  Task,
  TaskDetails,
} from './index'
import type {
  IBulkAddResponse,
  IRegionGroupSearchItem
} from './api'
import type {
  RealEstateDailyCollectResult,
  RealEstateScheduleSettings,
  RealEstateScheduleUpdatePayload,
} from './realEstate'

// Navigation Store Types
export type Page = 'tasks' | 'groups' | 'comments' | 'keywords' | 'watchlist' | 'authors'

export interface NavigationState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
}

// Comments Store Types
export interface CommentsState {
  comments: Comment[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  totalCount: number
  nextCursor: string | null
  fetchComments: (options?: { reset?: boolean; limit?: number }) => Promise<void>
  fetchCommentsCursor: (options?: { reset?: boolean; limit?: number }) => Promise<void>
  toggleReadStatus: (id: number) => Promise<void>
  markWatchlisted: (commentId: number, watchlistAuthorId: number) => void
}

// Keywords Store Types
export interface KeywordsState {
  keywords: Keyword[]
  isLoading: boolean
  fetchKeywords: () => Promise<void>
  addKeyword: (word: string, category?: string) => Promise<boolean>
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
  isLoading: boolean
  fetchGroups: () => Promise<void>
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
  statusFilter: 'all' | 'verified' | 'unverified'
  pageSize: number
  sortBy: AuthorSortField | null
  sortOrder: AuthorSortOrder
  fetchAuthors: (options?: { search?: string; reset?: boolean }) => Promise<void>
  loadMore: () => Promise<void>
  setSearch: (value: string) => void
  setStatusFilter: (value: 'all' | 'verified' | 'unverified') => void
  setSort: (value: AuthorSortField) => void
  markAuthorVerified: (vkUserId: number, verifiedAt: string | null) => void
  refreshAuthors: () => Promise<void>
}

export interface RealEstateScheduleState {
  settings: RealEstateScheduleSettings | null
  summary: RealEstateDailyCollectResult | null
  isLoading: boolean
  isUpdating: boolean
  isRunning: boolean
  fetchSettings: () => Promise<RealEstateScheduleSettings | null>
  updateSettings: (payload: RealEstateScheduleUpdatePayload) => Promise<boolean>
  runNow: () => Promise<boolean>
}
