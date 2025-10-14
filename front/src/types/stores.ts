import type { Comment, Keyword, Group, Task, TaskDetails } from './index'
import type { IBulkAddResponse } from './api'

// Navigation Store Types
export type Page = 'tasks' | 'groups' | 'comments' | 'keywords'

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
export interface GroupsState {
  groups: Group[]
  isLoading: boolean
  fetchGroups: () => Promise<void>
  addGroup: (url: string) => Promise<boolean>
  deleteGroup: (id: number) => Promise<void>
  loadFromFile: (file: File) => Promise<{ saved: number; errors: string[] }>
  deleteAllGroups: () => Promise<void>
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
