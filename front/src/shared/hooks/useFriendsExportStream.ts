import { useCallback, useEffect, useRef, useState } from 'react'
import type { SseEvent } from '../api/friends-export-types'

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

export function useFriendsExportStream(
  jobId: string | null,
  streamUrlBuilder: (jobId: string) => string,
): FriendsExportStreamState {
  const [logs, setLogs] = useState<SseEvent[]>([])
  const [progress, setProgress] = useState({ fetchedCount: 0, totalCount: 0 })
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [xlsxPath, setXlsxPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptRef = useRef(false)

  const reset = useCallback(() => {
    setLogs([])
    setProgress({ fetchedCount: 0, totalCount: 0 })
    setStatus('idle')
    setXlsxPath(null)
    setError(null)
    reconnectAttemptRef.current = false
  }, [])

  useEffect(() => {
    if (!jobId) {
      setStatus('idle')
      return
    }

    const url = streamUrlBuilder(jobId)
    console.log('[useFriendsExportStream] connecting:', url)

    setStatus('connecting')
    setError(null)
    setXlsxPath(null)

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (event: MessageEvent) => {
      try {
        const parsed: SseEvent = JSON.parse(event.data)
        console.log('[useFriendsExportStream] event:', parsed.type, parsed.data)

        if (parsed.type === 'progress') {
          setProgress({
            fetchedCount: parsed.data.fetchedCount,
            totalCount: parsed.data.totalCount,
          })
          if (status === 'connecting') {
            setStatus('running')
          }
        } else if (parsed.type === 'log') {
          setLogs((prev) => {
            const next = [...prev, parsed]
            return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next
          })
          if (status === 'connecting') {
            setStatus('running')
          }
        } else if (parsed.type === 'done') {
          console.log('[useFriendsExportStream] done:', parsed.data)
          setXlsxPath(parsed.data.xlsxPath)
          setStatus('done')
          es.close()
          eventSourceRef.current = null
        } else if (parsed.type === 'error') {
          console.log('[useFriendsExportStream] error:', parsed.data.message)
          setError(parsed.data.message)
          setStatus('error')
          es.close()
          eventSourceRef.current = null
        }
      } catch (err) {
        console.warn('[useFriendsExportStream] parse error:', err)
      }
    }

    es.onerror = () => {
      console.warn('[useFriendsExportStream] connection error')
      if (!reconnectAttemptRef.current && es.readyState !== EventSource.CLOSED) {
        reconnectAttemptRef.current = true
        console.log('[useFriendsExportStream] attempting reconnect...')
        es.close()
        return
      }
      setError('Connection lost')
      setStatus('error')
      es.close()
      eventSourceRef.current = null
    }

    return () => {
      console.log('[useFriendsExportStream] cleanup')
      es.close()
      eventSourceRef.current = null
    }
  }, [jobId, streamUrlBuilder])

  return { logs, progress, status, xlsxPath, error, reset }
}
