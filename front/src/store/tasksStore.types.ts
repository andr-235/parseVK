import type { Task, TaskDetails, TaskStatus, TaskStatsInfo } from '@/types'
import type { TasksState } from '@/shared/types'

export type TaskIdentifier = number | string

export type GroupStatus = TaskDetails['groups'][number]['status']

export interface GroupMetadata {
  id: TaskIdentifier
  name: string
}

export interface TaskStatusComputationContext {
  groupsCount?: number | null
  successCount?: number | null
  failedCount?: number | null
  processingCount?: number | null
}

export interface NormalizedTasksState {
  taskIds: TaskIdentifier[]
  tasksById: Record<string, Task>
}

export type PersistedTasksState = Pick<NormalizedTasksState, 'taskIds' | 'tasksById'>

export type TasksStore = TasksState & NormalizedTasksState

export type { Task, TaskDetails, TaskStatus, TaskStatsInfo }
