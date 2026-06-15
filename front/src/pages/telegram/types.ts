export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled'

export interface TelegramExportTask {
  id: string
  target: string
  status: TaskStatus
  totalCount: number
  fetchedCount: number
  progress: number
  logs: string[]
  createdAt: string
  settings: {
    limit: number
    activeOnly: boolean
    verifyPhones: boolean
  }
  error?: string
  taskType?: 'export' | 'live_parse'
}

export interface LimitOption {
  label: string
  value: number
}
