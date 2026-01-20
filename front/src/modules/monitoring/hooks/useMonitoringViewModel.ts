import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { monitoringService } from '@/services/monitoringService'
import type { IMonitorMessageResponse } from '@/types/api'

const POLL_INTERVAL_MS = 15000
const DEFAULT_LIMIT = 100

export type MonitoringTimeRange = 'day' | 'week' | 'month' | 'quarter' | 'all'

const TIME_RANGE_DAYS: Record<MonitoringTimeRange, number | null> = {
  day: 1,
  week: 7,
  month: 30,
  quarter: 90,
  all: null,
}

export const MONITORING_TIME_RANGES: Array<{
  value: MonitoringTimeRange
  label: string
}> = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: '3 месяца' },
  { value: 'all', label: 'Всё время' },
]

const resolveFromDate = (range: MonitoringTimeRange): string | undefined => {
  const days = TIME_RANGE_DAYS[range]
  if (!days) return undefined

  const from = new Date()
  from.setDate(from.getDate() - days)
  return from.toISOString()
}

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

type MonitoringViewModelOptions = {
  sources?: string[]
}

export const useMonitoringViewModel = ({ sources }: MonitoringViewModelOptions = {}) => {
  const [messages, setMessages] = useState<IMonitorMessageResponse[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [appliedKeywords, setAppliedKeywords] = useState<string[] | undefined>(undefined)
  const [usedKeywords, setUsedKeywords] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<MonitoringTimeRange>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [limit] = useState(DEFAULT_LIMIT)

  const isFetchingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  type FetchMessagesOptions = {
    overrideKeywords?: string[]
    page?: number
    append?: boolean
    overrideTimeRange?: MonitoringTimeRange
  }

  const fetchMessages = useCallback(
    async ({
      overrideKeywords,
      page: requestedPage = 1,
      append = false,
      overrideTimeRange,
    }: FetchMessagesOptions = {}) => {
      if (isFetchingRef.current) return

      const activeTimeRange = overrideTimeRange ?? timeRange
      const from = resolveFromDate(activeTimeRange)
      const isInitial = !hasLoadedRef.current && !append
      isFetchingRef.current = true
      setError(null)
      if (append) {
        setIsLoadingMore(true)
      } else if (isInitial) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const response = await monitoringService.fetchMessages({
          limit,
          page: requestedPage,
          keywords: overrideKeywords ?? appliedKeywords,
          from,
          sources,
        })

        setMessages((current) => (append ? [...current, ...response.items] : response.items))
        setUsedKeywords(response.usedKeywords)
        setLastUpdatedAt(response.lastSyncAt)
        setPage(response.page ?? requestedPage)
        setHasMore(response.hasMore ?? response.items.length === limit)
        hasLoadedRef.current = true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      } finally {
        if (append) {
          setIsLoadingMore(false)
        } else if (isInitial) {
          setIsLoading(false)
        } else {
          setIsRefreshing(false)
        }
        isFetchingRef.current = false
      }
    },
    [appliedKeywords, limit, sources, timeRange]
  )

  useEffect(() => {
    void fetchMessages({ page: 1 })
  }, [fetchMessages])

  useEffect(() => {
    if (!autoRefresh || page > 1) return

    const interval = setInterval(() => {
      void fetchMessages({ page: 1 })
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchMessages, page])

  const applyManualSearch = useCallback(() => {
    const nextKeywords = parseKeywordsInput(searchInput)
    setAppliedKeywords(nextKeywords)
    void fetchMessages({ overrideKeywords: nextKeywords, page: 1 })
  }, [fetchMessages, searchInput])

  const clearManualSearch = useCallback(() => {
    setSearchInput('')
    setAppliedKeywords(undefined)
    void fetchMessages({ page: 1 })
  }, [fetchMessages])

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((value) => !value)
  }, [])

  const changeTimeRange = useCallback(
    (nextRange: MonitoringTimeRange) => {
      if (nextRange === timeRange) return
      setTimeRange(nextRange)
      setPage(1)
      void fetchMessages({ page: 1, overrideTimeRange: nextRange })
    },
    [fetchMessages, timeRange]
  )

  const loadMore = useCallback(() => {
    if (isLoading || isRefreshing || isLoadingMore || !hasMore) return
    void fetchMessages({ page: page + 1, append: true })
  }, [fetchMessages, hasMore, isLoading, isLoadingMore, isRefreshing, page])

  const refreshNow = useCallback(() => {
    void fetchMessages({ page: 1 })
  }, [fetchMessages])

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
    timeRange,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    autoRefresh,
    page,
    hasMore,
    lastUpdatedAt,
    stats,
    applyManualSearch,
    clearManualSearch,
    toggleAutoRefresh,
    changeTimeRange,
    loadMore,
    refreshNow,
  }
}
