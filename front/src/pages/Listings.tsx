import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type OptionHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react'
import { motion } from 'framer-motion'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { listingsService } from '@/services/listingsService'
import ExportListingsModal from '@/components/ExportListingsModal'
import type { IListing } from '@/types/api'
import { cn } from '@/lib/utils'
import { ChevronDown, ExternalLink, MapPin, Phone, Calendar, Tag } from 'lucide-react'
import {
  useInfiniteListings,
  type UseInfiniteFetcher,
} from '@/hooks/useInfiniteListings'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const SOURCE_TITLE_MAP: Record<string, string> = {
  avito: 'Авито',
  youla: 'Юла',
  юла: 'Юла',
  avto: 'Авто',
}

const MotionCard = motion(Card)

type ListingsMeta = {
  total?: number
  sources?: string[]
}

type ListingsFetcherParams = {
  search?: string
  source?: string
}

// Dark mode: обновлённые стили выпадающего меню с использованием цветовых токенов темы.
const DROPDOWN_BASE_CLASSNAME =
  'w-full appearance-none rounded-lg border border-border/70 bg-background-secondary px-3 py-2 pr-9 text-sm text-text-primary shadow-soft-sm transition ease-out duration-200 hover:bg-background-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/70 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-background-secondary dark:shadow-soft-lg dark:hover:bg-white/10 dark:focus-visible:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]'

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  iconClassName?: string
}

const Dropdown = forwardRef<HTMLSelectElement, DropdownProps>(
  (
    {
      className,
      children,
      iconClassName = 'size-4 text-text-secondary dark:text-text-secondary',
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [isAnimated, setIsAnimated] = useState(false)

    useEffect(() => {
      const frame = requestAnimationFrame(() => setIsAnimated(true))
      return () => cancelAnimationFrame(frame)
    }, [])

    const handleFocus = (event: FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true)
      onFocus?.(event)
    }

    const handleBlur = (event: FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false)
      onBlur?.(event)
    }

    return (
      <div
        data-state={isFocused ? 'open' : 'closed'}
        data-animation={isAnimated ? 'visible' : 'hidden'}
        className="relative origin-top transform transition ease-out duration-200 data-[animation=hidden]:opacity-0 data-[animation=hidden]:scale-95 data-[animation=visible]:opacity-100 data-[animation=visible]:scale-100"
      >
        <select
          ref={ref}
          className={cn(DROPDOWN_BASE_CLASSNAME, className)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2',
            iconClassName,
          )}
        />
      </div>
    )
  },
)
Dropdown.displayName = 'Dropdown'

type MenuItemProps = OptionHTMLAttributes<HTMLOptionElement>

const MenuItem = (props: MenuItemProps) => <option {...props} />

const formatSourceLabel = (value?: string | null): string => {
  if (!value) {
    return 'Не указан'
  }

  const key = value.toLowerCase()
  if (SOURCE_TITLE_MAP[key]) {
    return SOURCE_TITLE_MAP[key]
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[a-zа-яё]|\s[a-zа-яё]/gi, (match) => match.toUpperCase())
}

const formatPrice = (price: number | null | undefined, currency?: string | null): string => {
  if (price == null) {
    return '—'
  }

  const formatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  })

  if (!currency) {
    return formatter.format(price)
  }

  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    return `${formatter.format(price)} ${currency}`
  }
}

const formatArea = (value: number | null | undefined): string | null => {
  if (value == null) {
    return null
  }

  return `${new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value)} м²`
}

const getMetadataString = (
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }

  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toLocaleString('ru-RU')
  }
}

const formatDateTimeWithFallback = (
  primary?: string | null,
  fallback?: string | null,
): string => {
  if (primary) {
    const formatted = formatDateTime(primary)
    if (formatted !== '—') {
      return formatted
    }
  }

  if (fallback && fallback.trim().length > 0) {
    return fallback
  }

  return '—'
}

const buildParameters = (listing: IListing): string | null => {
  const parts: string[] = []

  if (listing.rooms != null) {
    parts.push(`${listing.rooms} комн.`)
  }

  if (listing.areaTotal != null) {
    const area = formatArea(listing.areaTotal)
    if (area) {
      parts.push(area)
    }
  }

  if (listing.floor != null) {
    if (listing.floorsTotal != null) {
      parts.push(`${listing.floor}/${listing.floorsTotal} этаж`)
    } else {
      parts.push(`${listing.floor} этаж`)
    }
  } else if (listing.floorsTotal != null) {
    parts.push(`из ${listing.floorsTotal} этажей`)
  }

  if (parts.length === 0) {
    return null
  }

  return parts.join(' • ')
}

// Компонент карточки объявления с современным дизайном
interface ListingCardProps {
  listing: IListing
  expandedDescriptions: Set<number>
  onToggleDescription: (id: number) => void
  shouldAnimate?: boolean
  staggerDelay?: number
}

function ListingCard({
  listing,
  expandedDescriptions,
  onToggleDescription,
  shouldAnimate = false,
  staggerDelay = 0,
}: ListingCardProps) {
  const parameters = buildParameters(listing)
  const livingArea = formatArea(listing.areaLiving)
  const kitchenArea = formatArea(listing.areaKitchen)
  const primaryImage = listing.images.find((image) => image && image.trim().length > 0)
  const metadata = (listing.metadata ?? null) as Record<string, unknown> | null
  const metadataPostedAt =
    getMetadataString(metadata, 'posted_at') ?? getMetadataString(metadata, 'postedAt')
  const metadataPublishedAt =
    getMetadataString(metadata, 'published_at') ??
    getMetadataString(metadata, 'publishedAt')
  const metadataParsedAt =
    getMetadataString(metadata, 'parsed_at') ?? getMetadataString(metadata, 'parsedAt')
  const contactName =
    listing.contactName ??
    getMetadataString(metadata, 'author') ??
    getMetadataString(metadata, 'contact_name')
  const contactPhone =
    listing.contactPhone ??
    getMetadataString(metadata, 'author_phone') ??
    getMetadataString(metadata, 'contact_phone') ??
    getMetadataString(metadata, 'phone')
  const publishedDisplay = formatDateTimeWithFallback(
    listing.publishedAt ?? metadataPublishedAt,
    metadataPostedAt ?? metadataPublishedAt,
  )
  const updatedDisplay = formatDateTimeWithFallback(
    metadataParsedAt ?? listing.updatedAt,
    metadataParsedAt,
  )
  const descriptionText = listing.description?.trim() ?? ''
  const hasDescription = descriptionText.length > 0
  const shouldAllowToggle = descriptionText.length > 240
  const isDescriptionExpanded = expandedDescriptions.has(listing.id)

  return (
    <MotionCard
      layout
      initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        ease: 'easeOut',
        delay: shouldAnimate ? staggerDelay : 0,
      }}
      className="group h-full overflow-hidden border-border/70 bg-background-secondary shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-primary/10 dark:hover:shadow-accent-primary/20"
    >
        {/* Изображение */}
        {primaryImage && (
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            <img
              src={primaryImage}
              alt={listing.title ?? 'Объявление'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {listing.images.length > 1 && (
              <div className="absolute right-3 top-3 rounded-full bg-background-secondary/90 px-2.5 py-1 text-xs font-medium text-text-secondary shadow-sm">
                {listing.images.length} фото
              </div>
            )}
            {/* Бейдж источника */}
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-primary/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm shadow-sm">
                <Tag className="h-3 w-3" />
                {formatSourceLabel(listing.source ?? null)}
              </span>
            </div>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="space-y-2">
            {/* Заголовок */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 flex-1 text-lg font-semibold leading-tight text-text-primary group-hover:text-accent-primary transition-colors">
                {listing.title ?? 'Без названия'}
              </h3>
              {listing.url && (
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-text-secondary transition-colors hover:text-accent-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Цена */}
            {listing.price != null && (
              <div className="text-2xl font-bold text-accent-primary">
                {formatPrice(listing.price, listing.currency)}
              </div>
            )}

            {/* Параметры */}
            {(parameters || livingArea || kitchenArea) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-secondary">
                {parameters && <span className="font-medium">{parameters}</span>}
                {livingArea && <span>Жилая {livingArea}</span>}
                {kitchenArea && <span>Кухня {kitchenArea}</span>}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Описание */}
          {hasDescription && (
            <div className="space-y-1.5">
              <CardDescription className="text-sm leading-relaxed">
                <p
                  className={cn(
                    'whitespace-pre-line text-text-secondary',
                    !isDescriptionExpanded && shouldAllowToggle && 'line-clamp-3',
                  )}
                >
                  {descriptionText}
                </p>
              </CardDescription>
              {shouldAllowToggle && (
                <button
                  type="button"
                  onClick={() => onToggleDescription(listing.id)}
                  className="text-xs font-medium text-accent-primary transition-colors hover:text-accent-primary/80"
                >
                  {isDescriptionExpanded ? 'Свернуть описание' : 'Показать полностью'}
                </button>
              )}
            </div>
          )}

          {/* Адрес */}
          {(listing.city || listing.address) && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-secondary" />
              <div className="flex-1 space-y-0.5">
                {listing.city && (
                  <div className="font-medium text-text-primary">{listing.city}</div>
                )}
                {listing.address && (
                  <div className="text-text-secondary">{listing.address}</div>
                )}
              </div>
            </div>
          )}

          {/* Контакт */}
          {(contactName || contactPhone) && (
            <div className="flex items-start gap-2 text-sm">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-secondary" />
              <div className="flex-1 space-y-0.5">
                {contactName && (
                  <div className="font-medium text-text-primary">{contactName}</div>
                )}
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-accent-primary transition-colors hover:text-accent-primary/80"
                  >
                    {contactPhone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Даты */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-xs text-text-secondary">
            {publishedDisplay !== '—' && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Опубликовано: {publishedDisplay}</span>
              </div>
            )}
            {updatedDisplay !== '—' && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Обновлено: {updatedDisplay}</span>
              </div>
            )}
          </div>

          {/* Ссылка на объявление */}
          {listing.url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
            >
              <a
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Открыть объявление
              </a>
            </Button>
          )}
        </CardContent>
      </MotionCard>
  )
}

function ListingSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border/60 bg-background-secondary shadow-soft-sm">
      <div className="h-48 w-full animate-pulse bg-background-secondary/70 dark:bg-white/5" aria-hidden="true" />
      <CardContent className="space-y-4 py-5">
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-white/40 dark:bg-white/10" aria-hidden="true" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/30 dark:bg-white/5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-white/30 dark:bg-white/5" aria-hidden="true" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/25 dark:bg-white/5" aria-hidden="true" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-full animate-pulse rounded-md bg-white/30 dark:bg-white/5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}

interface ListingsInfiniteProps {
  fetcher: UseInfiniteFetcher<IListing, ListingsMeta, ListingsFetcherParams>
  limit: number
  filtersKey: string
  fetchParams: ListingsFetcherParams
  expandedDescriptions: Set<number>
  onToggleDescription: (id: number) => void
  onMetaChange?: (meta: ListingsMeta | null) => void
  onItemsChange?: (count: number) => void
  onLoadingChange?: (loading: boolean) => void
}

function ListingsInfinite({
  fetcher,
  limit,
  filtersKey,
  fetchParams,
  expandedDescriptions,
  onToggleDescription,
  onMetaChange,
  onItemsChange,
  onLoadingChange,
}: ListingsInfiniteProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const animatedIdsRef = useRef<Set<number>>(new Set())
  const [observerAvailable, setObserverAvailable] = useState(true)

  const {
    items,
    loading,
    initialLoading,
    error,
    hasMore,
    meta,
    loadMore,
    reset,
  } = useInfiniteListings<IListing, ListingsMeta, ListingsFetcherParams>({
    fetcher,
    limit,
    params: fetchParams,
    dependencies: [filtersKey],
  })

  const handleLoadMore = useCallback(async () => {
    await loadMore()
  }, [loadMore])

  useEffect(() => {
    animatedIdsRef.current.clear()
  }, [filtersKey])

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
    if (!sentinel) {
      return
    }

    try {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (entry?.isIntersecting && !loading) {
            handleLoadMore().catch(() => {
              // обработка ошибок выполняется в хукe
            })
          }
        },
        { root: null, rootMargin: '0px 0px 300px 0px', threshold: 0 },
      )

      observer.observe(sentinel)
      observerRef.current = observer
    } catch (observerError) {
      if (import.meta.env.DEV) {
        console.error('IntersectionObserver init error', observerError)
      }
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
    if (error) {
      return 'Не удалось загрузить объявления. Попробуйте ещё раз.'
    }
    if (loading && items.length === 0) {
      return 'Загружаем объявления…'
    }
    if (!hasMore) {
      return `Загружены все объявления (${items.length})`
    }
    return `Загружено ${items.length} объявлений`
  }, [error, hasMore, items.length, loading])

  const skeletonCount = initialLoading ? 6 : 3

  return (
    <div className="flex flex-col gap-6">
      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((listing, index) => {
          const hasAnimated = animatedIdsRef.current.has(listing.id)
          if (!hasAnimated) {
            animatedIdsRef.current.add(listing.id)
          }

          return (
            <ListingCard
              key={listing.id}
              listing={listing}
              expandedDescriptions={expandedDescriptions}
              onToggleDescription={onToggleDescription}
              shouldAnimate={!hasAnimated}
              staggerDelay={Math.min(index % 8, 6) * 0.04}
            />
          )
        })}

        {(initialLoading || (loading && items.length > 0)) &&
          Array.from({ length: skeletonCount }).map((_, index) => (
            <ListingSkeleton key={`skeleton-${index}`} />
          ))}
      </div>

      {!initialLoading && items.length === 0 && !loading && !error && (
        <div className="rounded-lg border border-border/60 bg-background-secondary px-6 py-8 text-center text-text-secondary">
          Пока нет объявлений, подходящих под условия поиска.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <span>Не удалось загрузить объявления. Попробуйте ещё раз.</span>
          <Button variant="outline" size="sm" onClick={() => handleLoadMore()}>
            Повторить
          </Button>
        </div>
      )}

      {hasMore && (!observerAvailable || error) && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleLoadMore()}
            disabled={loading}
          >
            {loading ? 'Загрузка…' : 'Показать ещё'}
          </Button>
        </div>
      )}

      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
    </div>
  )
}

function Listings() {
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [uploadSourceMode, setUploadSourceMode] = useState<'avito' | 'youla' | 'custom'>('avito')
  const [customSource, setCustomSource] = useState('')
  const [updateExisting, setUpdateExisting] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [totalItems, setTotalItems] = useState<number | null>(null)
  const [fetchedCount, setFetchedCount] = useState(0)
  const [refreshToken, setRefreshToken] = useState(0)
  const [isListLoading, setIsListLoading] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const querySource = sourceFilter === 'all' ? undefined : sourceFilter

  const fetchParams = useMemo<ListingsFetcherParams>(
    () => ({
      search: appliedSearch.trim() || undefined,
      source: querySource,
    }),
    [appliedSearch, querySource],
  )

  const filtersIdentity = useMemo(
    () =>
      JSON.stringify({
        search: fetchParams.search ?? '',
        source: fetchParams.source ?? 'all',
        pageSize,
      }),
    [fetchParams.search, fetchParams.source, pageSize],
  )

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        search: fetchParams.search ?? '',
        source: fetchParams.source ?? 'all',
        pageSize,
        refreshToken,
      }),
    [fetchParams.search, fetchParams.source, pageSize, refreshToken],
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
    if (!meta) {
      return
    }

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
    if (isListLoading && fetchedCount === 0) {
      return 'Загружаем объявления…'
    }

    if (totalItems != null) {
      if (totalItems === 0) {
        return 'Нет объявлений для отображения'
      }
      return `Загружено ${numberFormatter.format(fetchedCount)} из ${numberFormatter.format(totalItems)}`
    }

    if (fetchedCount > 0) {
      return `Загружено ${numberFormatter.format(fetchedCount)} объявлений`
    }

    return 'Нет объявлений для отображения'
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

  // Экспорт теперь через модальное окно-конструктор

  const resolvedUploadSource = uploadSourceMode === 'custom'
    ? customSource
    : uploadSourceMode

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsUploading(true)
    try {
      await listingsService.importFromJson({
        file,
        source: resolvedUploadSource,
        updateExisting,
      })
      setIsListLoading(true)
      setRefreshToken((token) => token + 1)
    } catch {
      // Ошибки отображаются в сервисе
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleUploadClick = () => {
    if (isUploading) {
      return
    }
    fileInputRef.current?.click()
  }

  const toggleDescription = (listingId: number) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev)
      if (next.has(listingId)) {
        next.delete(listingId)
      } else {
        next.add(listingId)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Объявления недвижимости"
        description="Просматривайте импортированные объявления в удобном формате карточек. Загружайте новые данные из JSON-файлов и управляйте коллекцией объявлений."
        actions={(
          <div className="flex w-full flex-col gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">
                Источник объявлений
              </label>
              <Dropdown
                value={uploadSourceMode}
                onChange={(event) =>
                  setUploadSourceMode(event.target.value as 'avito' | 'youla' | 'custom')
                }
              >
                <MenuItem value="avito">Авито</MenuItem>
                <MenuItem value="youla">Юла</MenuItem>
                <MenuItem value="custom">Другое...</MenuItem>
              </Dropdown>
            </div>

            {uploadSourceMode === 'custom' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-text-secondary">Название источника</label>
                <Input
                  value={customSource}
                  onChange={(event) => setCustomSource(event.target.value)}
                  placeholder="Например, Циан"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-accent-primary focus:ring-accent-primary"
                checked={updateExisting}
                onChange={(event) => setUpdateExisting(event.target.checked)}
              />
              Обновлять существующие объявления
            </label>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {isUploading ? 'Загрузка...' : 'Загрузить JSON'}
              </Button>
            </div>

            <p className="text-xs text-text-tertiary">
              Загрузите JSON-файл с массивом объявлений или объектом с полем
              <code className="mx-1 rounded bg-border/40 px-1 py-0.5">listings</code>.
            </p>
          </div>
        )}
      />

      <SectionCard
        title="Каталог объявлений"
        description="Используйте фильтры и поиск для быстрого нахождения нужных объявлений. Каждая карточка содержит всю важную информацию об объекте."
        headerActions={(
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isListLoading}
            >
              {isListLoading ? 'Обновляем…' : 'Обновить'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsExportOpen(true)}>
              Экспорт CSV
            </Button>
          </div>
        )}
      >
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.2fr)_minmax(200px,0.8fr)_minmax(140px,0.6fr)] lg:items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">Поиск</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleApplySearch()
                    }
                  }}
                  placeholder="Адрес, описание или контакты"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={handleApplySearch}>
                    Найти
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResetSearch}
                    disabled={!appliedSearch && !searchTerm}
                  >
                    Сбросить
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">Источник</label>
              <Dropdown value={sourceFilter} onChange={handleSourceChange}>
                {filterOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option === 'all' ? 'Все источники' : formatSourceLabel(option)}
                  </MenuItem>
                ))}
              </Dropdown>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">На странице</label>
              <Dropdown value={pageSize} onChange={handlePageSizeChange}>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Dropdown>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background-primary/80 px-4 py-3 text-sm">
            <div className="text-text-secondary">{summaryText}</div>
            <div className="text-xs text-text-tertiary">
              Данные обновляются автоматической догрузкой при прокрутке.
            </div>
          </div>

          <ListingsInfinite
            fetcher={fetchListingsBatch}
            limit={pageSize}
            filtersKey={filtersKey}
            fetchParams={fetchParams}
            expandedDescriptions={expandedDescriptions}
            onToggleDescription={toggleDescription}
            onMetaChange={handleMetaChange}
            onItemsChange={handleItemsChange}
            onLoadingChange={handleLoadingChange}
          />
        </div>
      </SectionCard>
      <ExportListingsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultSearch={appliedSearch}
        defaultSource={querySource}
      />
    </div>
  )
}

export default Listings
