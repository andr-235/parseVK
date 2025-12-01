import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import type { IListing } from '@/types/api'
import type { UseInfiniteFetcher } from '@/hooks/useInfiniteListings'
import { listingsService } from '@/services/listingsService'
import type { ListingsMeta, ListingsFetcherParams } from '../types'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export const useListingsViewModel = () => {
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
  >(
    async ({ limit, cursor, page, signal, params }) => {
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
    },
    [],
  )

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

  const handleApplySearch = useCallback(() => {
    setAppliedSearch(searchTerm.trim())
  }, [searchTerm])

  const handleResetSearch = useCallback(() => {
    setSearchTerm('')
    setAppliedSearch('')
  }, [])

  const handleSourceChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSourceFilter(event.target.value)
  }, [])

  const handleArchivedChange = useCallback((archived: boolean) => {
    setArchivedFilter(archived)
  }, [])

  const handlePageSizeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const nextSize = Number.parseInt(event.target.value, 10)
    setPageSize(Number.isNaN(nextSize) ? 20 : nextSize)
  }, [])

  const handleManualRefresh = useCallback(() => {
    setIsListLoading(true)
    setRefreshToken((token) => token + 1)
  }, [])

  const toggleDescription = useCallback((listingId: number) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev)
      if (next.has(listingId)) next.delete(listingId)
      else next.add(listingId)
      return next
    })
  }, [])

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

  return {
    pageSize,
    searchTerm,
    appliedSearch,
    sourceFilter,
    archivedFilter,
    expandedDescriptions,
    availableSources,
    totalItems,
    fetchedCount,
    refreshToken,
    isListLoading,
    isExportOpen,
    isImportOpen,
    noteListing,
    querySource,
    fetchParams,
    filtersKey,
    fetchListingsBatch,
    filterOptions,
    summaryText,
    PAGE_SIZE_OPTIONS,
    setSearchTerm,
    setIsExportOpen,
    setIsImportOpen,
    handleApplySearch,
    handleResetSearch,
    handleSourceChange,
    handleArchivedChange,
    handlePageSizeChange,
    handleManualRefresh,
    toggleDescription,
    handleAddNote,
    handleCloseEdit,
    handleListingUpdated,
    handleArchive,
    handleMetaChange,
    handleItemsChange,
    handleLoadingChange,
  }
}

