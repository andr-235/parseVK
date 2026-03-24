import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { tgmbaseSearchService } from '@/modules/tgmbase-search/api/tgmbaseSearch.api'
import { useTgmbaseSearch } from '@/modules/tgmbase-search/hooks/useTgmbaseSearch'
import type {
  TgmbaseSearchItem,
  TgmbaseSearchProgressEvent,
  TgmbaseSearchResponse,
} from '@/shared/types'

const DEFAULT_PAGE_SIZE = 20
const SEARCH_BATCH_SIZE = 200

type TgmbaseProgressState = {
  searchId: string
  status: 'connecting' | 'started' | 'progress' | 'completed' | 'failed'
  processedQueries: number
  totalQueries: number
  currentBatch: number
  totalBatches: number
  connected: boolean
  error: string | null
}
export type { TgmbaseProgressState }

const parseQueries = (value: string): string[] =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

const createSearchId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tgmbase-${Date.now()}-${Math.random().toString(36).slice(2)}`

const resolveSocketBaseUrl = (): string | null => {
  const raw = import.meta.env.VITE_API_WS_URL
  const trimmed = typeof raw === 'string' ? raw.trim() : ''

  if (trimmed === '' || trimmed.toLowerCase() === 'auto') {
    if (typeof window === 'undefined') {
      return null
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }

  return trimmed
}

const normalizeSocketBase = (url: string): string => {
  let trimmed = url.trim().replace(/\/$/, '')

  if (!/^wss?:\/\//i.test(trimmed)) {
    try {
      const absolute = new URL(
        trimmed,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      )
      trimmed = absolute.origin + absolute.pathname.replace(/\/$/, '')
    } catch {
      return trimmed
    }
  }

  return trimmed.replace(/\/api$/i, '').replace(/\/tgmbase-search$/i, '')
}

export function useTgmbaseSearchState() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<TgmbaseSearchResponse | null>(null)
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null)
  const [loadingMoreQuery, setLoadingMoreQuery] = useState<string | null>(null)
  const [progress, setProgress] = useState<TgmbaseProgressState | null>(null)
  const searchMutation = useTgmbaseSearch()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [])

  const connectToSearchProgress = (searchId: string) => {
    socketRef.current?.disconnect()

    const baseUrl = resolveSocketBaseUrl()
    if (!baseUrl) {
      return
    }

    const namespaceUrl = `${normalizeSocketBase(baseUrl)}/tgmbase-search`
    const socket: Socket = io(namespaceUrl, {
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setProgress((current) =>
        current?.searchId === searchId ? { ...current, connected: true } : current
      )
      socket.emit('subscribe', { searchId })
    })

    socket.on('disconnect', () => {
      setProgress((current) =>
        current?.searchId === searchId ? { ...current, connected: false } : current
      )
    })

    socket.on('tgmbase-search-progress', (payload: TgmbaseSearchProgressEvent) => {
      if (payload.searchId !== searchId) {
        return
      }

      setProgress((current) => {
        const connected = current?.connected ?? socket.connected
        return {
          searchId,
          status: payload.status,
          processedQueries: payload.processedQueries,
          totalQueries: payload.totalQueries,
          currentBatch: payload.currentBatch,
          totalBatches: payload.totalBatches,
          connected,
          error: payload.error ?? null,
        }
      })
    })
  }

  const submit = async (queries = parseQueries(input)) => {
    if (queries.length === 0) {
      return
    }

    const searchId = createSearchId()
    const totalBatches = Math.ceil(queries.length / SEARCH_BATCH_SIZE)
    setResult(null)
    setSelectedQuery(null)
    setProgress({
      searchId,
      status: 'connecting',
      processedQueries: 0,
      totalQueries: queries.length,
      currentBatch: totalBatches > 0 ? 1 : 0,
      totalBatches,
      connected: false,
      error: null,
    })
    connectToSearchProgress(searchId)

    try {
      const nextResult = await searchMutation.mutateAsync({
        queries,
        searchId,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      })

      setResult(nextResult)
      setSelectedQuery(nextResult.items[0]?.query ?? null)
      setProgress((current) =>
        current?.searchId === searchId
          ? {
              ...current,
              status: 'completed',
              processedQueries: queries.length,
              totalQueries: queries.length,
              currentBatch: totalBatches,
              totalBatches,
              error: null,
            }
          : current
      )
    } catch (error) {
      setProgress((current) =>
        current?.searchId === searchId
          ? {
              ...current,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Не удалось выполнить поиск',
            }
          : current
      )
      throw error
    } finally {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }

  const selectQuery = (query: string) => {
    setSelectedQuery(query)
  }

  const resetSearch = () => {
    socketRef.current?.disconnect()
    socketRef.current = null
    setInput('')
    setResult(null)
    setSelectedQuery(null)
    setLoadingMoreQuery(null)
    setProgress(null)
  }

  const loadMoreMessages = async (item: TgmbaseSearchItem) => {
    if (loadingMoreQuery || !item.messagesPage.hasMore) {
      return
    }

    setLoadingMoreQuery(item.query)

    try {
      const nextPage = item.messagesPage.page + 1
      const response = await tgmbaseSearchService.search({
        queries: [item.query],
        page: nextPage,
        pageSize: item.messagesPage.pageSize,
      })

      const nextItem = response.items[0]
      if (!nextItem) {
        return
      }

      setResult((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          items: current.items.map((currentItem) => {
            if (currentItem.query !== item.query) {
              return currentItem
            }

            return {
              ...nextItem,
              messagesPage: {
                ...nextItem.messagesPage,
                items: [
                  ...currentItem.messagesPage.items,
                  ...nextItem.messagesPage.items.filter(
                    (message) =>
                      !currentItem.messagesPage.items.some((existing) => existing.id === message.id)
                  ),
                ],
              },
            }
          }),
        }
      })
    } finally {
      setLoadingMoreQuery(null)
    }
  }

  return {
    input,
    setInput,
    result,
    progress,
    selectedQuery,
    isLoading: searchMutation.isPending,
    loadingMoreQuery,
    submit,
    resetSearch,
    selectQuery,
    loadMoreMessages,
  }
}
