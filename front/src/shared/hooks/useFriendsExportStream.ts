import { useCallback, useEffect, useRef, useState } from 'react'
import type { SseEvent } from '../api/friends-export-types'
import { getAccessToken } from '../api/client'

type StreamStatus = 'idle' | 'connecting' | 'running' | 'done' | 'error'

export type FriendsExportStreamState = {
  logs: SseEvent[]
  progress: { fetchedCount: number; totalCount: number }
  status: StreamStatus
  xlsxPath: string | null
  error: string | null
  reset: () => void
}

const MAX_LOG_LINES = 500
const RETRY_MAX_ATTEMPTS = 5
const RETRY_BASE_DELAY_MS = 200

function parseSseChunk(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''

  for (const part of parts) {
    for (const line of part.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const parsed: SseEvent = JSON.parse(line.slice(6))
          events.push(parsed)
        } catch (err) {
          console.warn('[useFriendsExportStream] parse error:', err)
        }
      }
    }
  }

  return { events, rest }
}

export function useFriendsExportStream(
  jobId: string | null,
  streamUrlBuilder: (jobId: string) => string,
): FriendsExportStreamState {
  const [logs, setLogs] = useState<SseEvent[]>([])
  const [progress, setProgress] = useState({ fetchedCount: 0, totalCount: 0 })
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [xlsxPath, setXlsxPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const statusRef = useRef<StreamStatus>('idle')

  const setStatusSafe = useCallback((newStatus: StreamStatus) => {
    statusRef.current = newStatus
    setStatus(newStatus)
  }, [])

  const reset = useCallback(() => {
    setLogs([])
    setProgress({ fetchedCount: 0, totalCount: 0 })
    setStatusSafe('idle')
    setXlsxPath(null)
    setError(null)
  }, [setStatusSafe])

  useEffect(() => {
    if (!jobId) {
      setStatusSafe('idle')
      return
    }

    const url = streamUrlBuilder(jobId)
    console.log('[useFriendsExportStream] connecting:', url)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setStatusSafe('connecting')
    setError(null)
    setXlsxPath(null)

    let buffer = ''

    async function connect(attempt = 0) {
      try {
        const token = getAccessToken()
        const headers: Record<string, string> = { Accept: 'text/event-stream' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(url, { headers, signal: abortController.signal })

        if (response.status === 404 && attempt < RETRY_MAX_ATTEMPTS) {
          const delay = RETRY_BASE_DELAY_MS * 2 ** attempt
          console.log('[FIX] SSE 404, retrying', { attempt, delay, url })
          await new Promise((resolve) => setTimeout(resolve, delay))
          return connect(attempt + 1)
        }

        if (!response.ok) {
          console.warn('[FIX] SSE connection failed', { status: response.status, url })
          if (response.status === 401) {
            setError('Unauthorized — session expired')
          } else {
            setError(`Connection failed: ${response.status}`)
          }
          setStatusSafe('error')
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          setStatusSafe('error')
          setError('Stream not supported')
          return
        }

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const { events, rest } = parseSseChunk(buffer)
          buffer = rest

          for (const parsed of events) {
            console.log('[useFriendsExportStream] event:', parsed.type, parsed.data)

            if (parsed.type === 'progress') {
              setProgress({
                fetchedCount: parsed.data.fetchedCount,
                totalCount: parsed.data.totalCount,
              })
              if (statusRef.current === 'connecting') {
                setStatusSafe('running')
              }
            } else if (parsed.type === 'log') {
              setLogs((prev) => {
                const next = [...prev, parsed]
                return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next
              })
              if (statusRef.current === 'connecting') {
                setStatusSafe('running')
              }
            } else if (parsed.type === 'done') {
              console.log('[useFriendsExportStream] done:', parsed.data)
              setXlsxPath(parsed.data.xlsxPath)
              setStatusSafe('done')
              abortController.abort()
            } else if (parsed.type === 'error') {
              console.log('[useFriendsExportStream] error:', parsed.data.message)
              setError(parsed.data.message)
              setStatusSafe('error')
              abortController.abort()
            }
          }
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          console.log('[useFriendsExportStream] aborted')
          return
        }
        console.error('[useFriendsExportStream] connection error:', err)
        setStatusSafe('error')
        setError('Connection lost')
      }
    }

    connect()

    return () => {
      console.log('[useFriendsExportStream] cleanup')
      abortController.abort()
      abortControllerRef.current = null
    }
  }, [jobId, streamUrlBuilder, setStatusSafe])

  return { logs, progress, status, xlsxPath, error, reset }
}
