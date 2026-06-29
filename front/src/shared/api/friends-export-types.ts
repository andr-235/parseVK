export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'

export type FriendsExportStartResponse = {
  jobId: string
  status: JobStatus
}

export type FriendsJobLogEntry = {
  id: string
  level: 'info' | 'warn' | 'error'
  message: string
  meta: unknown
  createdAt: string
}

export type FriendsJobState = {
  id: string
  status: JobStatus
  fetchedCount: number
  totalCount: number
  warning: string | null
  error: string | null
  xlsxPath: string | null
  createdAt: string
}

export type FriendsJobDetailResponse = {
  job: FriendsJobState
  logs: FriendsJobLogEntry[]
}

export type SseProgressData = {
  fetchedCount: number
  totalCount: number
  limitApplied: boolean
}

export type SseLogData = {
  level: 'info' | 'warn' | 'error'
  message: string
  meta: unknown
}

export type SseDoneData = {
  jobId: string
  status: 'DONE'
  fetchedCount: number
  totalCount: number | null
  warning: string | null
  xlsxPath: string | null
}

export type SseErrorData = {
  message: string
}

export type SseEvent =
  | { type: 'progress'; data: SseProgressData }
  | { type: 'log'; data: SseLogData }
  | { type: 'done'; data: SseDoneData }
  | { type: 'error'; data: SseErrorData }
