import { apiGet, apiPost, apiGetBlob } from './client'
import type { FriendsExportStartResponse, FriendsJobDetailResponse } from './friends-export-types'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export type StartVkFriendsExportParams = {
  user_id?: number
}

export async function startVkFriendsExport(params: StartVkFriendsExportParams): Promise<FriendsExportStartResponse> {
  console.log('[vk-friends] startExport:', params)
  try {
    const result = await apiPost<FriendsExportStartResponse>('/vk/friends/export', { params })
    console.log('[vk-friends] startExport jobId:', result.jobId)
    return result
  } catch (err) {
    console.warn('[vk-friends] startExport error:', err)
    throw err
  }
}

export async function getVkFriendsJob(jobId: string): Promise<FriendsJobDetailResponse> {
  console.log('[vk-friends] getJob:', jobId)
  try {
    return await apiGet<FriendsJobDetailResponse>(`/vk/friends/jobs/${jobId}`)
  } catch (err) {
    console.warn('[vk-friends] getJob error:', err)
    throw err
  }
}

export async function downloadVkFriendsXlsx(jobId: string): Promise<Blob> {
  console.log('[vk-friends] downloadXlsx:', jobId)
  try {
    return await apiGetBlob(`/vk/friends/jobs/${jobId}/download/xlsx`)
  } catch (err) {
    console.warn('[vk-friends] downloadXlsx error:', err)
    throw err
  }
}

export function getVkFriendsStreamUrl(jobId: string): string {
  return `${BASE_URL}/vk/friends/jobs/${jobId}/stream`
}
