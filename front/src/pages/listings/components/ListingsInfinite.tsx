import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'
import {
  useInfiniteScroll as useInfiniteListings,
  type UseInfiniteFetcher,
} from '@/shared/hooks/useInfiniteScroll'
import type { IListing } from '@/shared/types'
import { ListingsTable } from './ListingsTable'
import type {
  ListingsMeta,
  ListingsFetcherParams,
  ListingsSortField,
} from '@/pages/listings/types/listingsTypes'

interface ListingsInfiniteProps {
  fetcher: UseInfiniteFetcher<IListing, ListingsMeta, ListingsFetcherParams>
  limit: number
  filtersKey: string
  fetchParams: ListingsFetcherParams
  isArchivedView?: boolean
  sortBy?: ListingsSortField
  sortOrder?: 'asc' | 'desc'
  onAddNote: (listing: IListing) => void
  onEdit: (listing: IListing) => void
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
  isArchivedView = false,
  sortBy,
  sortOrder,
  onAddNote,
  onEdit,
  onArchive,
  onDelete,
  onSortChange,
  onMetaChange,
  onItemsChange,
  onLoadingChange,
}: ListingsInfiniteProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
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
    if (typeof IntersectionObserver === 'undefined') {
      setObserverAvailable(false)
    }
  }, [])

  useIntersectionObserver(
    sentinelRef,
    () => {
      handleLoadMore().catch((err) => {
        if (import.meta.env.DEV) {
          console.error('Failed to load more listings:', err)
        }
      })
    },
    {
      enabled: observerAvailable && hasMore && !loading,
      rootMargin: '0px 0px 400px 0px',
      threshold: 0,
    }
  )

  useEffect(() => {
    return () => {
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
          isArchivedView={isArchivedView}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onAddNote={onAddNote}
          onEdit={onEdit}
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
