import { apiGet, apiPost, apiDelete } from './client'

export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
export type TaskScope = 'all' | 'selected'
export type TaskMode = 'recent_posts' | 'recheck_group'
export type TaskSource = 'manual' | 'automation'

export type Task = {
  id: number
  title: string
  description: Record<string, unknown> | null
  completed: boolean
  totalItems: number
  processedItems: number
  progress: number
  status: TaskStatus
  scope: TaskScope | null
  mode: TaskMode | null
  groupIds: number[]
  postLimit: number | null
  source: TaskSource
  stats: Record<string, unknown> | null
  error: string | null
  skippedGroupsMessage: string | null
  createdAt: string
  updatedAt: string
}

export type TaskListResponse = {
  tasks: Task[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export type CreateTaskParams = {
  scope: TaskScope
  groupIds?: number[]
  postLimit?: number
  mode: TaskMode
}

export type AutomationSettings = {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
  lastRunAt: string | null
  nextRunAt: string | null
  isRunning: boolean
}

export type AutomationSettingsUpdate = {
  enabled: boolean
  runHour: number
  runMinute: number
  postLimit: number
  timezoneOffsetMinutes: number
}

export type AutomationRunResponse = {
  started: boolean
  reason: string | null
  settings: AutomationSettings
}

export async function fetchTasks(page = 1, limit = 25): Promise<TaskListResponse> {
  return apiGet<TaskListResponse>('/tasks', { page, limit })
}

export async function createTask(params: CreateTaskParams): Promise<Task> {
  return apiPost<Task>('/tasks/parse', params)
}

export async function resumeTask(taskId: number): Promise<Task> {
  return apiPost<Task>(`/tasks/${taskId}/resume`)
}

export async function checkTask(taskId: number): Promise<Task> {
  return apiPost<Task>(`/tasks/${taskId}/check`)
}

export async function deleteTask(taskId: number): Promise<void> {
  await apiDelete<{ deleted: boolean }>(`/tasks/${taskId}`)
}

export async function cancelTask(taskId: number): Promise<Task> {
  return apiPost<Task>(`/tasks/${taskId}/cancel`)
}

export async function batchDeleteTasks(taskIds: number[]): Promise<void> {
  await Promise.all(taskIds.map((id) => apiDelete<{ deleted: boolean }>(`/tasks/${id}`)))
}

export async function getAutomationSettings(): Promise<AutomationSettings> {
  return apiGet<AutomationSettings>('/tasks/automation/settings')
}

export async function updateAutomationSettings(settings: AutomationSettingsUpdate): Promise<AutomationSettings> {
  return apiPost<AutomationSettings>('/tasks/automation/settings', settings)
}

export async function runAutomation(): Promise<AutomationRunResponse> {
  return apiPost<AutomationRunResponse>('/tasks/automation/run')
}
