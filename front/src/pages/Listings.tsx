import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listingsService } from '@/services/listingsService'
import ExportListingsModal from './Listings/components/ExportListingsModal'
import ImportListingsModal from './Listings/components/ImportListingsModal'
import EditListingModal from './Listings/components/EditListingModal'
import type { IListing } from '@/types/api'
import { Search, RefreshCw, Download, Upload, SlidersHorizontal } from 'lucide-react'
import type { UseInfiniteFetcher } from '@/hooks/useInfiniteListings'
import { ListingsInfinite } from './Listings/components/ListingsInfinite'
import type { ListingsMeta, ListingsFetcherParams } from './Listings/types'
import PageTitle from '@/components/PageTitle'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const formatSourceLabel = (value?: string | null): string => {
  if (!value) return 'Не указан'
  const map: Record<string, string> = {
    avito: 'Авито',
    youla: 'Юла',
    юла: 'Юла',
    avto: 'Авто',
  }
  const key = value.toLowerCase()
  return map[key] || value
}

function Listings() {
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [archivedFilter, setArchivedFilter] = useState(false)
  
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [totalItems, setTotalItems] = useState<number | null>(null)
  const [fetchedCount, setFetchedCount] = useState(0)
  const [refreshToken, setRefreshToken] = useState(0)
  const [isListLoading, setIsListLoading] = useState(false)
  
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [noteListing, setNoteListing] = useState<IListing | null>(null)

  const querySource = sourceFilter === 'all' ? undefined : sourceFilter

  const fetchParams = useMemo<ListingsFetcherParams>(
    () => ({
      search: appliedSearch.trim() || undefined,
      source: querySource,
      archived: archivedFilter || undefined,
    }),
    [appliedSearch, querySource, archivedFilter],
  )

  const filtersIdentity = useMemo(
    () =>
      JSON.stringify({
        search: fetchParams.search ?? '',
        source: fetchParams.source ?? 'all',
        archived: fetchParams.archived ?? false,
        pageSize,
      }),
    [fetchParams, pageSize],
  )

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        ...JSON.parse(filtersIdentity),
        refreshToken,
      }),
    [filtersIdentity, refreshToken],
  )

  const fetchListingsBatch = useCallback<
    UseInfiniteFetcher<IListing, ListingsMeta, ListingsFetcherParams>
  >(async ({ limit, cursor, page, signal, params }) => {
    const cursorAsPage =
      cursor && Number.isFinite(Number.parseInt(cursor, 10))
        ? Number.parseInt(cursor, 10)
        : undefined

    const response = await listingsService.fetchListings({
      page: cursorAsPage ?? page ?? 1,
      pageSize: limit,
      search: params?.search,
      source: params?.source,
      archived: params?.archived,
      signal,
    })

    return {
      items: response.items,
      page: response.page,
      hasMore: response.hasMore,
      meta: {
        total: response.total,
        sources: response.sources,
      },
    }
  }, [])

  const filterOptions = useMemo(() => {
    const sanitized = availableSources.filter((item) => item.trim().length > 0)
    const unique = Array.from(new Set(sanitized))

    if (sourceFilter !== 'all' && !unique.includes(sourceFilter)) {
      unique.unshift(sourceFilter)
    }

    return ['all', ...unique]
  }, [availableSources, sourceFilter])

  useEffect(() => {
    setExpandedDescriptions(new Set())
  }, [filtersIdentity])

  const numberFormatter = useMemo(() => new Intl.NumberFormat('ru-RU'), [])

  useEffect(() => {
    setFetchedCount(0)
    setTotalItems(null)
    setIsListLoading(true)
  }, [filtersIdentity])

  const handleMetaChange = useCallback((meta: ListingsMeta | null) => {
    if (!meta) return

    if (typeof meta.total === 'number') {
      setTotalItems(meta.total)
    }

    if (Array.isArray(meta.sources)) {
      const sanitized = meta.sources
        .map((item) => item?.trim?.() ?? '')
        .filter((item) => item.length > 0)
      setAvailableSources(Array.from(new Set(sanitized)))
    }
  }, [])

  const handleItemsChange = useCallback((count: number) => {
    setFetchedCount(count)
  }, [])

  const handleLoadingChange = useCallback((state: boolean) => {
    setIsListLoading(state)
  }, [])

  const summaryText = useMemo(() => {
    if (isListLoading && fetchedCount === 0) return 'Загружаем объявления…'
    if (totalItems != null) {
      if (totalItems === 0) return 'Нет объявлений'
      return `${numberFormatter.format(fetchedCount)} из ${numberFormatter.format(totalItems)}`
    }
    if (fetchedCount > 0) return `Загружено ${numberFormatter.format(fetchedCount)}`
    return 'Нет объявлений'
  }, [fetchedCount, isListLoading, numberFormatter, totalItems])

  const handleApplySearch = () => {
    setAppliedSearch(searchTerm.trim())
  }

  const handleResetSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
  }

  const handleSourceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSourceFilter(event.target.value)
  }

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSize = Number.parseInt(event.target.value, 10)
    setPageSize(Number.isNaN(nextSize) ? 20 : nextSize)
  }

  const handleManualRefresh = () => {
    setIsListLoading(true)
    setRefreshToken((token) => token + 1)
  }

  const toggleDescription = (listingId: number) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev)
      if (next.has(listingId)) next.delete(listingId)
      else next.add(listingId)
      return next
    })
  }

  const handleAddNote = useCallback((listing: IListing) => {
    setNoteListing(listing)
  }, [])

  const handleCloseEdit = useCallback(() => {
    setNoteListing(null)
  }, [])

  const handleListingUpdated = useCallback((_listing: IListing) => {
    setNoteListing(null)
    setIsListLoading(true)
    setRefreshToken((token) => token + 1)
  }, [])

  const handleArchive = useCallback(async (listing: IListing) => {
    try {
      await listingsService.archiveListing(listing.id)
      setIsListLoading(true)
      setRefreshToken((token) => token + 1)
    } catch {
      // Ошибки отображаются в сервисе
    }
  }, [])

  const selectClass = "h-10 rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <PageTitle>Недвижимость</PageTitle>
          <p className="max-w-2xl text-text-secondary">
            База объявлений из различных источников. Импорт, просмотр и управление статусами.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Импорт
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExportOpen(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          <Button
            variant="secondary"
            onClick={handleManualRefresh}
            disabled={isListLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isListLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background-secondary p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
        </div>
        
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
              placeholder="Поиск по адресу, описанию..."
              className="pl-9 bg-background-primary"
            />
            {searchTerm && (
              <button
                onClick={handleResetSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary hover:text-accent-primary"
              >
                Сбросить
              </button>
            )}
          </div>

          <select
            value={sourceFilter}
            onChange={handleSourceChange}
            className={`${selectClass} min-w-[160px]`}
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'Все источники' : formatSourceLabel(option)}
              </option>
            ))}
          </select>

          <select
            value={archivedFilter ? 'archived' : 'active'}
            onChange={(e) => setArchivedFilter(e.target.value === 'archived')}
            className={`${selectClass} min-w-[140px]`}
          >
            <option value="active">Активные</option>
            <option value="archived">В архиве</option>
          </select>

          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className={`${selectClass} w-[120px]`}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} стр.
              </option>
            ))}
          </select>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4 text-sm">
          <div className="text-text-secondary">
            {summaryText}
          </div>
          {appliedSearch && (
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">Результаты поиска:</span>
              <span className="rounded bg-accent-primary/10 px-2 py-0.5 font-medium text-accent-primary">
                {appliedSearch}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <ListingsInfinite
        fetcher={fetchListingsBatch}
        limit={pageSize}
        filtersKey={filtersKey}
        fetchParams={fetchParams}
        expandedDescriptions={expandedDescriptions}
        onToggleDescription={toggleDescription}
        onAddNote={handleAddNote}
        onArchive={handleArchive}
        onMetaChange={handleMetaChange}
        onItemsChange={handleItemsChange}
        onLoadingChange={handleLoadingChange}
      />

      <EditListingModal
        listing={noteListing}
        isOpen={Boolean(noteListing)}
        onClose={handleCloseEdit}
        onUpdated={handleListingUpdated}
      />
      
      <ExportListingsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultSearch={appliedSearch}
        defaultSource={querySource}
      />
      
      <ImportListingsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleManualRefresh}
      />
    </div>
  )
}

export default Listings
