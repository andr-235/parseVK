import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { createRequest, handleResponse } from '@/lib/apiUtils'
import { saveReportBlob } from '@/utils/reportExport'

export type VkFriendsOrder = 'hints' | 'random' | 'name' | 'mobile' | 'smart'
export type VkFriendsNameCase = 'nom' | 'gen' | 'dat' | 'acc' | 'ins' | 'abl'
export type ExportJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
export type JobLogLevel = 'info' | 'warn' | 'error'

export interface VkFriendsParams {
  user_id?: number
  order?: VkFriendsOrder
  list_id?: number
  count?: number
  offset?: number
  fields?: string[]
  name_case?: VkFriendsNameCase
  ref?: string
}

export interface VkFriendsExportResponse {
  jobId: string
  status: ExportJobStatus
}

export interface VkFriendsJob {
  id: string
  status: ExportJobStatus
  totalCount?: number | null
  fetchedCount: number
  warning?: string | null
  error?: string | null
  docxPath?: string | null
}

export interface VkFriendsJobLog {
  id: string
  level: JobLogLevel
  message: string
  meta?: unknown
  createdAt: string
}

export interface VkFriendsJobResponse {
  job: VkFriendsJob
  logs: VkFriendsJobLog[]
}

export type VkFriendsStreamEvent =
  | {
      type: 'progress'
      data: {
        fetchedCount: number
        totalCount: number
        limitApplied?: boolean
      }
    }
  | {
      type: 'log'
      data: {
        level: JobLogLevel
        message: string
        meta?: unknown
      }
    }
  | {
      type: 'done'
      data: {
        jobId: string
        status: ExportJobStatus
        fetchedCount: number
        totalCount?: number
        warning?: string
        docxPath?: string
      }
    }
  | {
      type: 'error'
      data: {
        message: string
      }
    }

interface StreamHandlers {
  onEvent: (event: VkFriendsStreamEvent) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onClose?: () => void
}

const extractFilename = (disposition: string | null, fallback: string): string => {
  if (!disposition) {
    return fallback
  }

  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition)
  const encodedName = match?.[1]
  const simpleName = match?.[2]

  if (encodedName) {
    try {
      return decodeURIComponent(encodedName)
    } catch {
      return encodedName
    }
  }

  return simpleName || fallback
}

const parseSseEvent = (raw: string): VkFriendsStreamEvent | null => {
  const lines = raw.split('\n')
  let eventType: VkFriendsStreamEvent['type'] | null = null
  const dataParts: string[] = []

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue
    }

    if (line.startsWith('event:')) {
      const value = line.slice(6).trim()
      if (value === 'progress' || value === 'log' || value === 'done' || value === 'error') {
        eventType = value
      }
      continue
    }

    if (line.startsWith('data:')) {
      dataParts.push(line.slice(5).trimStart())
    }
  }

  if (!eventType) {
    return null
  }

  const rawData = dataParts.join('\n')
  if (!rawData) {
    return null
  }

  let parsed: unknown = rawData
  try {
    parsed = JSON.parse(rawData)
  } catch {
    parsed = rawData
  }

  switch (eventType) {
    case 'progress':
      return {
        type: 'progress',
        data: parsed as Extract<VkFriendsStreamEvent, { type: 'progress' }>['data'],
      }
    case 'log':
      return {
        type: 'log',
        data: parsed as Extract<VkFriendsStreamEvent, { type: 'log' }>['data'],
      }
    case 'done':
      return {
        type: 'done',
        data: parsed as Extract<VkFriendsStreamEvent, { type: 'done' }>['data'],
      }
    case 'error':
      return {
        type: 'error',
        data: parsed as Extract<VkFriendsStreamEvent, { type: 'error' }>['data'],
      }
    default:
      return null
  }
}

const readSseStream = async (
  response: Response,
  onEvent: (event: VkFriendsStreamEvent) => void
): Promise<void> => {
  const body = response.body
  if (!body) {
    throw new Error('Stream is not available')
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n')

    let delimiterIndex = buffer.indexOf('\n\n')
    while (delimiterIndex >= 0) {
      const chunk = buffer.slice(0, delimiterIndex).trim()
      buffer = buffer.slice(delimiterIndex + 2)

      if (chunk) {
        const parsed = parseSseEvent(chunk)
        if (parsed) {
          onEvent(parsed)
        }
      }

      delimiterIndex = buffer.indexOf('\n\n')
    }
  }
}

export const vkFriendsExportService = {
  async export(payload: { params: VkFriendsParams }): Promise<VkFriendsExportResponse> {
    try {
      const response = await createRequest(`${API_URL}/vk/friends/export`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return await handleResponse<VkFriendsExportResponse>(response, 'Failed to start export')
    } catch (error) {
      toast.error('Не удалось запустить экспорт друзей')
      throw error
    }
  },

  async getJob(jobId: string): Promise<VkFriendsJobResponse> {
    try {
      const response = await createRequest(`${API_URL}/vk/friends/jobs/${jobId}`)
      return await handleResponse<VkFriendsJobResponse>(response, 'Failed to fetch job')
    } catch (error) {
      toast.error('Не удалось загрузить статус экспорта')
      throw error
    }
  },

  streamJob(jobId: string, handlers: StreamHandlers): { close: () => void } {
    const controller = new AbortController()

    const run = async () => {
      try {
        const response = await createRequest(`${API_URL}/vk/friends/jobs/${jobId}/stream`, {
          headers: {
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          cache: 'no-store',
        })

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

  async downloadJobFile(jobId: string, type: 'docx'): Promise<void> {
    try {
      const response = await createRequest(`${API_URL}/vk/friends/jobs/${jobId}/download/${type}`)

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        const errorMessage = text || 'Failed to download export file'
        throw new Error(errorMessage)
      }

      const blob = await response.blob()

      // Проверка, что blob не пустой
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const fallbackName = `vk_friends_${jobId}.${type}`
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
