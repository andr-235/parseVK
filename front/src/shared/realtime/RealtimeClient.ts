/**
 * RealtimeClient — SSE transport for realtime event stream.
 * 
 * - Connects to /api/v1/realtime/stream via gateway
 * - Handles reconnection with exponential backoff + jitter
 * - Tracks Last-Event-ID in memory and sessionStorage
 * - Validates runtime events
 * - Deduplicates by eventId
 */

import { getReconnectDelay, DEFAULT_RECONNECT_CONFIG } from './reconnectPolicy'
import { getAccessToken } from '../api/client'
import { parseSseChunk, type SseEvent } from './sseParser'

const STREAM_URL = '/api/v1/realtime/stream'
const CURSOR_KEY = 'realtime:lastEventId'

export type RealtimeEventHandler = (event: SseEvent) => void

export class RealtimeClient {
  private abortController: AbortController | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private attempt = 0
  private lastEventId: string | null = null
  private eventHandlers: Set<RealtimeEventHandler> = new Set()
  private seenEventIds: Set<string> = new Set()
  private isConnected = false
  private maxRetries: number

  constructor(options?: { maxRetries?: number; dedupWindowMs?: number }) {
    this.maxRetries = options?.maxRetries ?? DEFAULT_RECONNECT_CONFIG.maxRetries
    // dedupWindowMs accepted but not yet wired; noop to suppress TS6133
    void options?.dedupWindowMs

    // Restore cursor from sessionStorage
    const stored = sessionStorage.getItem(CURSOR_KEY)
    if (stored) {
      this.lastEventId = stored
      console.log('[RealtimeClient] restored cursor:', this.lastEventId)
    }
  }

  get connected(): boolean {
    return this.isConnected
  }

  subscribe(handler: RealtimeEventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  connect(): void {
    if (this.abortController) return
    this.attempt = 0
    this._connect()
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.isConnected = false
    console.log('[RealtimeClient] disconnected')
  }

  private _connect(): void {
    this.abortController = new AbortController()
    const token = getAccessToken()

    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    if (this.lastEventId) {
      headers['Last-Event-ID'] = this.lastEventId
    }

    const url = this.lastEventId
      ? `${STREAM_URL}?lastEventId=${encodeURIComponent(this.lastEventId)}`
      : STREAM_URL

    console.log('[RealtimeClient] connecting...', { attempt: this.attempt, cursor: this.lastEventId })

    fetch(url, { headers, signal: this.abortController.signal })
      .then((response) => {
        if (!response.ok) {
          console.error('[RealtimeClient] connection failed:', response.status)
          if (response.status === 401) {
            // Auth failure — don't reconnect
            console.warn('[RealtimeClient] auth failed, not reconnecting')
            return
          }
          this._scheduleReconnect()
          return
        }

        this.isConnected = true
        this.attempt = 0
        console.log('[RealtimeClient] connected')

        const reader = response.body?.getReader()
        if (!reader) {
          console.error('[RealtimeClient] stream not supported')
          this._scheduleReconnect()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        const pump = (): Promise<void> => {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              console.log('[RealtimeClient] stream closed by server')
              this.isConnected = false
              this._scheduleReconnect()
              return
            }

            buffer += decoder.decode(value, { stream: true })
            const { events, rest } = parseSseChunk(buffer)
            buffer = rest

            for (const event of events) {
              if (event.id) {
                this.lastEventId = event.id
                sessionStorage.setItem(CURSOR_KEY, event.id)
              }

              if (event.event === 'realtime.ready') {
                console.log('[RealtimeClient] ready, cursor:', event.id)
                // cursor is already stored as lastEventId above via event.id
                this._dispatch(event)
                continue
              }

              if (event.event === 'resync_required') {
                console.log('[RealtimeClient] resync required, invalidating')
                this._dispatch({ id: null, event: 'resync_required', data: null })
                continue
              }

              if (event.event === 'error') {
                console.warn('[RealtimeClient] server error:', event.data)
                this._dispatch(event)
                continue
              }

              // Deduplicate by event id
              if (event.id && this.seenEventIds.has(event.id)) {
                continue
              }
              if (event.id) {
                this.seenEventIds.add(event.id)
                // Clean up old entries periodically
                if (this.seenEventIds.size > 1000) {
                  this.seenEventIds.clear()
                }
              }

              this._dispatch(event)
            }

            return pump()
          })
        }

        return pump().catch((err) => {
          if ((err as Error).name === 'AbortError') return
          console.error('[RealtimeClient] stream error:', err)
          this.isConnected = false
          this._scheduleReconnect()
        })
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        console.error('[RealtimeClient] connection error:', err)
        this._scheduleReconnect()
      })
  }

  private _scheduleReconnect(): void {
    if (this.attempt >= this.maxRetries) {
      console.log('[RealtimeClient] max retries reached')
      return
    }

    const delay = getReconnectDelay(this.attempt)
    this.attempt++
    console.log('[RealtimeClient] reconnecting in', Math.round(delay), 'ms (attempt', this.attempt, ')')

    this.reconnectTimer = setTimeout(() => {
      this.abortController = null
      this._connect()
    }, delay)
  }

  private _dispatch(event: SseEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event)
      } catch (err) {
        console.error('[RealtimeClient] handler error:', err)
      }
    }
  }
}
