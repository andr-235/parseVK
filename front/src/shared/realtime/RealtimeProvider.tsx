/**
 * RealtimeProvider — React context provider for realtime event stream.
 * 
 * Maintains a single RealtimeClient instance per tab.
 * Dispatches parsed events to subscribers via context.
 * Handles resync (invalidate queries on resync_required).
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimeClient, type RealtimeEventHandler } from './RealtimeClient'

interface RealtimeContextValue {
  subscribe: (handler: RealtimeEventHandler) => () => void
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

// Singleton client per tab
let clientInstance: RealtimeClient | null = null

function getClient(): RealtimeClient {
  if (!clientInstance) {
    clientInstance = new RealtimeClient({ maxRetries: 10 })
  }
  return clientInstance
}

interface RealtimeProviderProps {
  children: ReactNode
  enabled?: boolean
}

export function RealtimeProvider({ children, enabled = true }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const handlersRef = useRef<Set<RealtimeEventHandler>>(new Set())
  const clientRef = useRef<RealtimeClient | null>(null)
  const queryClient = useQueryClient()
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const subscribe = useCallback((handler: RealtimeEventHandler): () => void => {
    handlersRef.current.add(handler)
    return () => {
      handlersRef.current.delete(handler)
    }
  }, [])

  // Coalesced comments invalidation (200ms window)
  const invalidateComments = useCallback(() => {
    if (coalesceTimerRef.current) {
      clearTimeout(coalesceTimerRef.current)
    }
    coalesceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      console.log('[RealtimeProvider] invalidated comments query')
      coalesceTimerRef.current = null
    }, 200)
  }, [queryClient])

  // Cleanup coalesce timer on unmount
  useEffect(() => {
    return () => {
      if (coalesceTimerRef.current) {
        clearTimeout(coalesceTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const client = getClient()
    clientRef.current = client

    const eventHandler: RealtimeEventHandler = (event) => {
      // Dispatch to all registered handlers
      for (const handler of handlersRef.current) {
        handler(event)
      }

      // React Query integration
      if (event.event === 'content.comments_projected') {
        invalidateComments()
      } else if (event.event === 'task.state_changed') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        console.log('[RealtimeProvider] invalidated tasks query due to state change')
      } else if (event.event === 'resync_required') {
        console.log('[RealtimeProvider] resync required, invalidating all')
        queryClient.invalidateQueries({ queryKey: ['comments'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    }

    const unsubscribe = client.subscribe(eventHandler)

    // Poll for connection status
    const statusInterval = setInterval(() => {
      if (clientRef.current) {
        setIsConnected(clientRef.current.connected)
      }
    }, 5000)

    client.connect()

    return () => {
      unsubscribe()
      clearInterval(statusInterval)
    }
  }, [enabled, queryClient, invalidateComments])

  return (
    <RealtimeContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext)
  if (!ctx) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return ctx
}

export { RealtimeClient }
