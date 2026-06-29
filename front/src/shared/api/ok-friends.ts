import { apiGet, apiPost, apiGetBlob } from './client'
import type { FriendsExportStartResponse, FriendsJobDetailResponse } from './friends-export-types'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export type StartOkFriendsExportParams = {
  fid?: string
  limit?: number
  offset?: number
}

export async function startOkFriendsExport(params: StartOkFriendsExportParams): Promise<FriendsExportStartResponse> {
  console.log('[ok-friends] startExport:', params)
  try {
    const result = await apiPost<FriendsExportStartResponse>('/ok/friends/export', { params })
    console.log('[ok-friends] startExport jobId:', result.jobId)
    return result
  } catch (err) {
    console.warn('[ok-friends] startExport error:', err)
    throw err
  }
}

export async function getOkFriendsJob(jobId: string): Promise<FriendsJobDetailResponse> {
  console.log('[ok-friends] getJob:', jobId)
  try {
    return await apiGet<FriendsJobDetailResponse>(`/ok/friends/jobs/${jobId}`)
  } catch (err) {
    console.warn('[ok-friends] getJob error:', err)
    throw err
  }
}

export async function downloadOkFriendsXlsx(jobId: string): Promise<Blob> {
  console.log('[ok-friends] downloadXlsx:', jobId)
  try {
    return await apiGetBlob(`/ok/friends/jobs/${jobId}/download/xlsx`)
  } catch (err) {
    console.warn('[ok-friends] downloadXlsx error:', err)
    throw err
  }
}

export function getOkFriendsStreamUrl(jobId: string): string {
  return `${BASE_URL}/ok/friends/jobs/${jobId}/stream`
}
