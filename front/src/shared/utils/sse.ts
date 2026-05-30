import type { ExportJobStatus, JobLogLevel } from '@/shared/types'
export type { ExportJobStatus, JobLogLevel }

export type ExportStreamEvent =
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
        xlsxPath?: string
      }
    }
  | {
      type: 'error'
      data: {
        message: string
      }
    }

export interface StreamHandlers {
  onEvent: (event: ExportStreamEvent) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onClose?: () => void
}

export const extractFilename = (disposition: string | null, fallback: string): string => {
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

export const parseSseEvent = (raw: string): ExportStreamEvent | null => {
  const lines = raw.split('\n')
  let eventType: ExportStreamEvent['type'] | null = null
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
        data: parsed as Extract<ExportStreamEvent, { type: 'progress' }>['data'],
      }
    case 'log':
      return {
        type: 'log',
        data: parsed as Extract<ExportStreamEvent, { type: 'log' }>['data'],
      }
    case 'done':
      return {
        type: 'done',
        data: parsed as Extract<ExportStreamEvent, { type: 'done' }>['data'],
      }
    case 'error':
      return {
        type: 'error',
        data: parsed as Extract<ExportStreamEvent, { type: 'error' }>['data'],
      }
    default:
      return null
  }
}

export const readSseStream = async (
  response: Response,
  onEvent: (event: ExportStreamEvent) => void
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
