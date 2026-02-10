import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/shared/ui/button'
import {
  useInfiniteListings,
  type UseInfiniteFetcher,
} from '@/modules/listings/hooks/useInfiniteListings'
import type { IListing } from '@/shared/types'
import { ListingsTable } from './ListingsTable'
import type {
  ListingsMeta,
  ListingsFetcherParams,
  ListingsSortField,
} from '@/modules/listings/types/listingsTypes'

interface ListingsInfiniteProps {
  fetcher: UseInfiniteFetcher<IListing, ListingsMeta, ListingsFetcherParams>
  limit: number
  filtersKey: string
  fetchParams: ListingsFetcherParams
  sortBy?: ListingsSortField
  sortOrder?: 'asc' | 'desc'
  onAddNote: (listing: IListing) => void
  onArchive: (listing: IListing) => void | Promise<void>
  onDelete: (listing: IListing) => void | Promise<void>
  onSortChange: (field: ListingsSortField) => void
  onMetaChange?: (meta: ListingsMeta | null) => void
  onItemsChange?: (count: number) => void
  onLoadingChange?: (loading: boolean) => void
}

export function ListingsInfinite({
  fetcher,
  limit,
  filtersKey,
  fetchParams,
  sortBy,
  sortOrder,
  onAddNote,
  onArchive,
  onDelete,
  onSortChange,
  onMetaChange,
  onItemsChange,
  onLoadingChange,
}: ListingsInfiniteProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [observerAvailable, setObserverAvailable] = useState(true)

  const { items, loading, initialLoading, error, hasMore, meta, loadMore, reset } =
    useInfiniteListings<IListing, ListingsMeta, ListingsFetcherParams>({
      fetcher,
      limit,
      params: fetchParams,
      dependencies: [filtersKey],
    })

  const handleLoadMore = useCallback(async () => {
    await loadMore()
  }, [loadMore])

  useEffect(() => {
    onMetaChange?.(meta ?? null)
  }, [meta, onMetaChange])

  useEffect(() => {
    onItemsChange?.(items.length)
  }, [items.length, onItemsChange])

  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  useEffect(() => {
    if (!observerAvailable || !hasMore) {
      observerRef.current?.disconnect()
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setObserverAvailable(false)
      return
    }

    const sentinel = sentinelRef.current
    if (!sentinel) return

    try {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (entry?.isIntersecting && !loading) {
            handleLoadMore().catch((err) => {
              if (import.meta.env.DEV) {
                console.error('Failed to load more listings:', err)
              }
            })
          }
        },
        { root: null, rootMargin: '0px 0px 400px 0px', threshold: 0 }
      )

      observer.observe(sentinel)
      observerRef.current = observer
    } catch (observerError) {
      console.error('IntersectionObserver init error', observerError)
      setObserverAvailable(false)
    }

    return () => observerRef.current?.disconnect()
  }, [handleLoadMore, hasMore, loading, observerAvailable])

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
      reset()
    }
  }, [reset])

  const statusMessage = useMemo(() => {
    if (error) return 'Не удалось загрузить объявления.'
    if (loading && items.length === 0) return 'Загружаем объявления…'
    if (!hasMore) return `Загружены все объявления (${items.length})`
    return `Загружено ${items.length} объявлений`
  }, [error, hasMore, items.length, loading])

  return (
    <div className="flex flex-col gap-6">
      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      {!initialLoading && items.length === 0 && !loading && !error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-background-secondary p-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Ничего не найдено</h3>
          <p className="text-text-secondary">Попробуйте изменить параметры поиска или фильтры.</p>
        </div>
      ) : (
        <ListingsTable
          items={items}
          loading={loading}
          initialLoading={initialLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onAddNote={onAddNote}
          onArchive={onArchive}
          onDelete={onDelete}
          onSortChange={onSortChange}
        />
      )}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          <span>Не удалось загрузить объявления. Попробуйте ещё раз.</span>
          <Button variant="outline" size="sm" onClick={() => handleLoadMore()}>
            Повторить
          </Button>
        </div>
      )}

      {hasMore && (!observerAvailable || error) && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            onClick={() => handleLoadMore()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Загрузка…' : 'Показать ещё'}
          </Button>
        </div>
      )}

      <div ref={sentinelRef} className="h-px w-full opacity-0" aria-hidden="true" />
    </div>
  )
}
