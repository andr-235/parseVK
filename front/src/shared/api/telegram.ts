import { apiGet, apiPost, apiGetBlob } from './client'

export type TelegramJobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled'

export type TelegramJobState = {
  id: string
  status: TelegramJobStatus
  fetchedCount: number
  totalCount: number
  warning?: string | null
  error?: string | null
  xlsxPath?: string | null
  createdAt: string
}

export type TelegramJobLogEntry = {
  id: string
  level: string
  message: string
  createdAt: string
}

export type TelegramJobDetail = {
  job: TelegramJobState
  logs: TelegramJobLogEntry[]
}

export type TelegramExportStartRequest = {
  target: string
  limit: number
  activeOnly: boolean
  verifyPhones: boolean
}

export async function startTelegramExport(params: TelegramExportStartRequest): Promise<{ jobId: string; status: string }> {
  return apiPost<{ jobId: string; status: string }>('/telegram/export', params)
}

export async function fetchTelegramJob(jobId: string): Promise<TelegramJobDetail> {
  return apiGet<TelegramJobDetail>(`/telegram/jobs/${jobId}`)
}

export async function cancelTelegramJob(jobId: string): Promise<{ status: string }> {
  return apiPost<{ status: string }>(`/telegram/jobs/${jobId}/cancel`)
}

export async function downloadTelegramXlsx(jobId: string): Promise<Blob> {
  return apiGetBlob(`/telegram/jobs/${jobId}/download/xlsx`)
}
