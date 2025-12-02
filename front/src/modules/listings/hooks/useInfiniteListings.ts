import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type CursorResponse<T, M = unknown> = {
  items: T[]
  nextCursor?: string | null
  hasMore?: boolean
  meta?: M
}

type PageResponse<T, M = unknown> = {
  items: T[]
  page: number
  hasMore: boolean
  meta?: M
}

type FetchResponse<T, M = unknown> = CursorResponse<T, M> | PageResponse<T, M>

export interface UseInfiniteFetcherParams<P = Record<string, unknown>> {
  limit: number
  cursor?: string | null
  page?: number
  signal: AbortSignal
  params?: P
}

export type UseInfiniteFetcher<T, M = unknown, P = Record<string, unknown>> = (
  params: UseInfiniteFetcherParams<P>
) => Promise<FetchResponse<T, M>>

interface UseInfiniteListingsOptions<T, M = unknown, P = Record<string, unknown>> {
  fetcher: UseInfiniteFetcher<T, M, P>
  limit?: number
  params?: P
  enabled?: boolean
  dependencies?: ReadonlyArray<unknown>
}

interface UseInfiniteListingsResult<T, M = unknown> {
  items: T[]
  loading: boolean
  initialLoading: boolean
  error: Error | null
  hasMore: boolean
  meta: M | null
  loadMore: () => Promise<void>
  reset: () => void
}

type Mode = 'cursor' | 'page' | null

const isCursorResponse = <T, M>(response: FetchResponse<T, M>): response is CursorResponse<T, M> =>
  'nextCursor' in response

export function useInfiniteListings<T, M = unknown, P = Record<string, unknown>>(
  options: UseInfiniteListingsOptions<T, M, P>
): UseInfiniteListingsResult<T, M> {
  const { fetcher, limit = 20, params, enabled = true, dependencies = [] } = options

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [meta, setMeta] = useState<M | null>(null)

  const modeRef = useRef<Mode>(null)
  const cursorRef = useRef<string | null>(null)
  const pageRef = useRef(1)
  const initialLoadedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string | number, T[]>>(new Map())

  const initialLoading = !initialLoadedRef.current && loading

  const cleanupAbort = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }

  const reset = useCallback(() => {
    cleanupAbort()
    setItems([])
    setError(null)
    setHasMore(true)
    setMeta(null)
    modeRef.current = null
    cursorRef.current = null
    pageRef.current = 1
    cacheRef.current.clear()
    initialLoadedRef.current = false
  }, [])

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore) {
      return
    }

    setLoading(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    const requestPage = modeRef.current === 'page' ? pageRef.current + 1 : pageRef.current || 1
    const requestCursor = cursorRef.current

    const cacheKey = modeRef.current === 'cursor' ? (requestCursor ?? 'root') : requestPage

    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey) ?? []
      setItems((prev) => [...prev, ...cached])
      setLoading(false)
      return
    }

    try {
      const response = await fetcher({
        limit,
        cursor: modeRef.current === 'cursor' ? requestCursor : null,
        page: requestPage,
        signal: controller.signal,
        params,
      })

      initialLoadedRef.current = true
      const responseItems = response.items ?? []

      setItems((prev) => [...prev, ...responseItems])
      cacheRef.current.set(cacheKey, responseItems)
      const nextMeta = (response as CursorResponse<T, M> | PageResponse<T, M>).meta
      if (nextMeta !== undefined) {
        setMeta(nextMeta ?? null)
      }

      if (isCursorResponse(response)) {
        modeRef.current = 'cursor'
        cursorRef.current = response.nextCursor ?? null
        const cursorHasMore =
          response.hasMore ?? (response.nextCursor != null && response.nextCursor !== '')
        setHasMore(cursorHasMore)
        if (!cursorHasMore) {
          cursorRef.current = null
        }
      } else {
        modeRef.current = 'page'
        pageRef.current = response.page ?? requestPage
        setHasMore(response.hasMore)
        if (!response.hasMore) {
          cursorRef.current = null
        }
      }
    } catch (fetchError) {
      if ((fetchError as Error).name === 'AbortError') {
        return
      }
      setError(fetchError as Error)
    } finally {
      setLoading(false)
    }
  }, [enabled, fetcher, hasMore, limit, loading, params])

  const depsKey = useMemo(() => dependencies.map((dep) => `${dep}`).join('|'), [dependencies])

  useEffect(() => {
    if (!enabled) {
      return () => cleanupAbort()
    }

    reset()

    const schedule = requestAnimationFrame(() => {
      loadMore().catch(() => {})
    })

    return () => {
      cleanupAbort()
      cancelAnimationFrame(schedule)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, limit, depsKey, reset])

  useEffect(() => () => cleanupAbort(), [])

  return {
    items,
    loading,
    initialLoading,
    error,
    hasMore,
    meta,
    loadMore,
    reset,
  }
}
