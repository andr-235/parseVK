import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { monitoringService } from '@/services/monitoringService'
import type { IMonitorMessageResponse } from '@/types/api'

const POLL_INTERVAL_MS = 15000
const DEFAULT_LIMIT = 50

const parseKeywordsInput = (value: string): string[] | undefined => {
  const tokens = value
    .split(/[,;\n]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  if (tokens.length === 0) {
    return undefined
  }

  return Array.from(new Set(tokens))
}

export const useMonitoringViewModel = () => {
  const [messages, setMessages] = useState<IMonitorMessageResponse[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [appliedKeywords, setAppliedKeywords] = useState<string[] | undefined>(undefined)
  const [usedKeywords, setUsedKeywords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [limit] = useState(DEFAULT_LIMIT)

  const isFetchingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const fetchMessages = useCallback(
    async (overrideKeywords?: string[]) => {
      if (isFetchingRef.current) return

      const isInitial = !hasLoadedRef.current
      isFetchingRef.current = true
      setError(null)
      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const response = await monitoringService.fetchMessages({
          limit,
          keywords: overrideKeywords ?? appliedKeywords,
        })

        setMessages(response.items)
        setUsedKeywords(response.usedKeywords)
        setLastUpdatedAt(response.lastSyncAt)
        hasLoadedRef.current = true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      } finally {
        if (isInitial) {
          setIsLoading(false)
        } else {
          setIsRefreshing(false)
        }
        isFetchingRef.current = false
      }
    },
    [appliedKeywords, limit]
  )

  useEffect(() => {
    void fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      void fetchMessages()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchMessages])

  const applyManualSearch = useCallback(() => {
    const nextKeywords = parseKeywordsInput(searchInput)
    setAppliedKeywords(nextKeywords)
    void fetchMessages(nextKeywords)
  }, [fetchMessages, searchInput])

  const clearManualSearch = useCallback(() => {
    setSearchInput('')
    setAppliedKeywords(undefined)
    void fetchMessages(undefined)
  }, [fetchMessages])

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((value) => !value)
  }, [])

  const stats = useMemo(
    () => ({
      total: messages.length,
      usedKeywordsCount: usedKeywords.length,
    }),
    [messages.length, usedKeywords.length]
  )

  return {
    messages,
    searchInput,
    setSearchInput,
    usedKeywords,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    lastUpdatedAt,
    stats,
    applyManualSearch,
    clearManualSearch,
    toggleAutoRefresh,
    refreshNow: fetchMessages,
  }
}
