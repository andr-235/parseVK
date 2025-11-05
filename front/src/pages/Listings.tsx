import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type OptionHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
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
import { Spinner } from '@/components/ui/spinner'
import { queryKeys } from '@/queries/queryKeys'
import { listingsService } from '@/services/listingsService'
import type { IListing, IListingsResponse } from '@/types/api'
import { cn } from '@/lib/utils'
import { ChevronDown, ExternalLink, MapPin, Phone, Calendar, Tag } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const SOURCE_TITLE_MAP: Record<string, string> = {
  avito: 'Авито',
  youla: 'Юла',
  юла: 'Юла',
  avto: 'Авто',
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
}

function ListingCard({ listing, expandedDescriptions, onToggleDescription }: ListingCardProps) {
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
    <Card className="group h-full overflow-hidden border-border/70 bg-background-secondary shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent-primary/10 dark:hover:shadow-accent-primary/20 hover:-translate-y-1">
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
      </Card>
  )
}

function Listings() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [uploadSourceMode, setUploadSourceMode] = useState<'avito' | 'youla' | 'custom'>('avito')
  const [customSource, setCustomSource] = useState('')
  const [updateExisting, setUpdateExisting] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const querySource = sourceFilter === 'all' ? undefined : sourceFilter

  const listingsQuery = useQuery<
    IListingsResponse,
    Error,
    IListingsResponse,
    ReturnType<typeof queryKeys.listings.list>
  >({
    queryKey: queryKeys.listings.list({
      page,
      pageSize,
      search: appliedSearch,
      source: sourceFilter,
    }),
    queryFn: () =>
      listingsService.fetchListings({
        page,
        pageSize,
        search: appliedSearch || undefined,
        source: querySource,
      }),
    placeholderData: keepPreviousData,
  })

  const availableSources = useMemo(() => {
    return (listingsQuery.data?.sources ?? []).filter((item) => item.trim().length > 0)
  }, [listingsQuery.data?.sources])

  const filterOptions = useMemo(() => {
    const unique = Array.from(new Set(availableSources))

    if (sourceFilter !== 'all' && !unique.includes(sourceFilter)) {
      unique.unshift(sourceFilter)
    }

    return ['all', ...unique]
  }, [availableSources, sourceFilter])

  const items = useMemo(
    () => listingsQuery.data?.items ?? [],
    [listingsQuery.data?.items],
  )
  const totalItems = listingsQuery.data?.total ?? 0

  const totalPages = useMemo(() => {
    if (totalItems === 0) {
      return 1
    }
    return Math.max(1, Math.ceil(totalItems / pageSize))
  }, [totalItems, pageSize])

  useEffect(() => {
    if (totalItems === 0) {
      if (page !== 1) {
        setPage(1)
      }
      return
    }

    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalItems, totalPages, page])

  const numberFormatter = useMemo(() => new Intl.NumberFormat('ru-RU'), [])

  useEffect(() => {
    setExpandedDescriptions((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const availableIds = new Set(items.map((item) => item.id))
      let mutated = false
      const next = new Set<number>()
      prev.forEach((id) => {
        if (availableIds.has(id)) {
          next.add(id)
        } else {
          mutated = true
        }
      })
      return mutated ? next : prev
    })
  }, [items])

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = totalItems === 0 ? 0 : Math.min(totalItems, rangeStart + items.length - 1)

  const handleApplySearch = () => {
    setAppliedSearch(searchTerm.trim())
    setPage(1)
  }

  const handleResetSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(1)
  }

  const handleSourceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSourceFilter(event.target.value)
    setPage(1)
  }

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSize = Number.parseInt(event.target.value, 10)
    setPageSize(nextSize)
    setPage(1)
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((current) => current - 1)
    }
  }

  const handleNextPage = () => {
    if (listingsQuery.data?.hasMore) {
      setPage((current) => current + 1)
    }
  }

  const handleManualRefresh = () => {
    void listingsQuery.refetch()
  }

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
      await listingsQuery.refetch()
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

  const hasItems = items.length > 0
  const isInitialLoading = listingsQuery.isLoading
  const isFetching = listingsQuery.isFetching && !isInitialLoading

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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={listingsQuery.isFetching}
          >
            {listingsQuery.isFetching ? 'Обновление…' : 'Обновить'}
          </Button>
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
            <div className="text-text-secondary">
              {totalItems > 0
                ? `Показаны объявления ${numberFormatter.format(rangeStart)}–${numberFormatter.format(rangeEnd)} из ${numberFormatter.format(totalItems)}`
                : 'Нет объявлений для отображения'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1 || listingsQuery.isFetching}
              >
                Назад
              </Button>
              <span className="text-text-secondary">
                Страница {numberFormatter.format(page)} из {numberFormatter.format(totalPages)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!listingsQuery.data?.hasMore || listingsQuery.isFetching}
              >
                Вперёд
              </Button>
            </div>
          </div>

          {listingsQuery.isError && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {(listingsQuery.error instanceof Error
                ? listingsQuery.error.message
                : 'Не удалось загрузить данные')}
            </div>
          )}

          {/* Сетка карточек объявлений */}
          {isInitialLoading && (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border/70 bg-background-secondary py-12">
              <div className="flex flex-col items-center gap-3 text-sm text-text-secondary">
                <Spinner className="h-8 w-8" />
                <span>Загрузка объявлений…</span>
              </div>
            </div>
          )}

          {!isInitialLoading && !hasItems && (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border/70 bg-background-secondary py-12">
              <div className="text-center text-sm text-text-secondary">
                <p className="text-lg font-medium text-text-primary mb-2">Объявления не найдены</p>
                <p>Попробуйте изменить параметры поиска или фильтры</p>
              </div>
            </div>
          )}

          {!isInitialLoading && hasItems && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ListingCard
                      listing={item}
                      expandedDescriptions={expandedDescriptions}
                      onToggleDescription={toggleDescription}
                    />
                  </motion.div>
                ))}
              </div>

              {isFetching && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background-secondary py-4 text-sm text-text-secondary">
                  <Spinner className="h-4 w-4" />
                  <span>Обновляем данные…</span>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

export default Listings
