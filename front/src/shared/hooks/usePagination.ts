import { useState, useCallback, useMemo } from 'react'

export function usePagination<T>(items: T[], defaultPageSize = 25) {
  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState(defaultPageSize)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize

  const paged = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize])

  const setPage = useCallback((p: number) => setPageState(p), [])
  const setPageSize = useCallback((s: number) => { setPageSizeState(s); setPageState(1) }, [])

  return { page: safePage, pageSize, totalPages, totalItems: items.length, paged, setPage, setPageSize }
}
