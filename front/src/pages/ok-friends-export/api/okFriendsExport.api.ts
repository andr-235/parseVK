import toast from 'react-hot-toast'
import { GATEWAY_API_URL } from '@/api/common'
import { createRequest, handleResponse } from '@/api/common'
import { saveReportBlob } from '@/utils/common'
import type {
  ExportJobStatus,
  JobLogLevel,
  ExportStreamEvent,
  StreamHandlers,
} from '@/api/common/sse'
import { extractFilename, readSseStream } from '@/api/common/sse'

export interface OkFriendsParams {
  fid?: string
  offset?: number
  limit?: number
}

export interface OkFriendsExportResponse {
  jobId: string
  status: ExportJobStatus
}

export interface OkFriendsJob {
  id: string
  status: ExportJobStatus
  totalCount?: number | null
  fetchedCount: number
  warning?: string | null
  error?: string | null
  xlsxPath?: string | null
}

export interface OkFriendsJobLog {
  id: string
  level: JobLogLevel
  message: string
  meta?: unknown
  createdAt: string
}

export interface OkFriendsJobResponse {
  job: OkFriendsJob
  logs: OkFriendsJobLog[]
}

export type OkFriendsStreamEvent = ExportStreamEvent

export const okFriendsExportService = {
  async export(payload: { params: OkFriendsParams }): Promise<OkFriendsExportResponse> {
    try {
      const response = await createRequest(`${GATEWAY_API_URL}/v1/ok/friends/export`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return await handleResponse<OkFriendsExportResponse>(response, 'Failed to start export')
    } catch (error) {
      toast.error('Не удалось запустить экспорт друзей')
      throw error
    }
  },

  async getJob(jobId: string): Promise<OkFriendsJobResponse> {
    try {
      const response = await createRequest(`${GATEWAY_API_URL}/v1/ok/friends/jobs/${jobId}`)
      return await handleResponse<OkFriendsJobResponse>(response, 'Failed to fetch job')
    } catch (error) {
      toast.error('Не удалось загрузить статус экспорта')
      throw error
    }
  },

  streamJob(jobId: string, handlers: StreamHandlers): { close: () => void } {
    const controller = new AbortController()

    const run = async () => {
      try {
        const response = await createRequest(
          `${GATEWAY_API_URL}/v1/ok/friends/jobs/${jobId}/stream`,
          {
            headers: {
              Accept: 'text/event-stream',
            },
            signal: controller.signal,
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          throw new Error(errorText || 'Failed to connect to stream')
        }

        handlers.onOpen?.()
        await readSseStream(response, handlers.onEvent)
        handlers.onClose?.()
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        handlers.onError?.(error as Error)
      }
    }

    void run()

    return {
      close: () => controller.abort(),
    }
  },

  async downloadJobFile(jobId: string, type: 'xlsx'): Promise<void> {
    try {
      const response = await createRequest(
        `${GATEWAY_API_URL}/v1/ok/friends/jobs/${jobId}/download/${type}`
      )

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        const errorMessage = text || 'Failed to download export file'
        throw new Error(errorMessage)
      }

      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const fallbackName = `ok_friends_${jobId}.${type}`
      const filename = extractFilename(response.headers.get('Content-Disposition'), fallbackName)

      saveReportBlob(blob, filename)
      toast.success(`Файл ${type.toUpperCase()} сохранён`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      toast.error(`Не удалось скачать ${type.toUpperCase()}: ${errorMessage}`)
      throw error
    }
  },
}
