import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { queryKeys } from '@/queries/queryKeys'
import { listingsService } from '@/services/listingsService'
import type { IListing } from '@/types/api'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const SOURCE_TITLE_MAP: Record<string, string> = {
  avito: 'Авито',
  youla: 'Юла',
  юла: 'Юла',
  avto: 'Авто',
}

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

  const fileInputRef = useRef<HTMLInputElement>(null)

  const querySource = sourceFilter === 'all' ? undefined : sourceFilter

  const listingsQuery = useQuery({
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
    keepPreviousData: true,
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

  const items = listingsQuery.data?.items ?? []
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

  const hasItems = items.length > 0
  const isInitialLoading = listingsQuery.isLoading
  const isFetching = listingsQuery.isFetching && !isInitialLoading

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Объявления недвижимости"
        description="Просматривайте импортированные объявления и загружайте новые данные из JSON-файлов."
        actions={(
          <div className="flex w-full flex-col gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-text-secondary">
                Источник объявлений
              </label>
              <select
                value={uploadSourceMode}
                onChange={(event) =>
                  setUploadSourceMode(event.target.value as 'avito' | 'youla' | 'custom')
                }
                className="rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary shadow-sm focus:border-accent-primary focus:outline-none"
              >
                <option value="avito">Авито</option>
                <option value="youla">Юла</option>
                <option value="custom">Другое...</option>
              </select>
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
          </div>
        )}
      />

      <SectionCard
        title="Импортированные объявления"
        description="Фильтруйте и просматривайте информацию об объектах."
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
              <select
                value={sourceFilter}
                onChange={handleSourceChange}
                className="rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary shadow-sm focus:border-accent-primary focus:outline-none"
              >
                {filterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'Все источники' : formatSourceLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">На странице</label>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary shadow-sm focus:border-accent-primary focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {(listingsQuery.error instanceof Error
                ? listingsQuery.error.message
                : 'Не удалось загрузить данные')}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Источник</TableHead>
                  <TableHead>Объявление</TableHead>
                  <TableHead className="whitespace-nowrap">Цена</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Параметры</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead className="whitespace-nowrap">Опубликовано</TableHead>
                  <TableHead className="whitespace-nowrap">Обновлено</TableHead>
                  <TableHead className="w-[140px]">Ссылки</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-text-secondary">
                      <div className="flex items-center justify-center gap-2">
                        <Spinner className="h-5 w-5" />
                        Загрузка объявлений…
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!isInitialLoading && !hasItems && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-text-secondary">
                      Объявления не найдены
                    </TableCell>
                  </TableRow>
                )}

                {!isInitialLoading &&
                  items.map((item) => {
                    const parameters = buildParameters(item)
                    const livingArea = formatArea(item.areaLiving)
                    const kitchenArea = formatArea(item.areaKitchen)
                    const primaryImage = item.images.find((image) => image && image.trim().length > 0)

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap font-medium text-text-secondary">
                          {formatSourceLabel(item.source ?? null)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-text-primary">
                              {item.title ?? 'Без названия'}
                            </span>
                            {item.description && (
                              <p className="text-sm text-text-secondary line-clamp-3">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {formatPrice(item.price, item.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {item.city && (
                              <span className="font-medium text-text-primary">{item.city}</span>
                            )}
                            {item.address && (
                              <span className="text-sm text-text-secondary">{item.address}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-text-primary">
                            {parameters ?? <span className="text-text-secondary">—</span>}
                            {livingArea && (
                              <span className="text-xs text-text-secondary">Жилая {livingArea}</span>
                            )}
                            {kitchenArea && (
                              <span className="text-xs text-text-secondary">Кухня {kitchenArea}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {item.contactName && (
                              <span className="font-medium text-text-primary">{item.contactName}</span>
                            )}
                            {item.contactPhone && (
                              <span className="text-sm text-text-secondary">{item.contactPhone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                          {formatDateTime(item.publishedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                          {formatDateTime(item.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Button type="button" asChild size="sm" variant="outline">
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                Открыть
                              </a>
                            </Button>
                            {primaryImage && (
                              <Button type="button" asChild size="sm" variant="ghost">
                                <a href={primaryImage} target="_blank" rel="noopener noreferrer">
                                  Фото ({item.images.length})
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                {isFetching && hasItems && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-4 text-center text-sm text-text-secondary">
                      <div className="flex items-center justify-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Обновляем данные…
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

export default Listings
