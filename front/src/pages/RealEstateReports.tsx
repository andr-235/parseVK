import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FileDown, RefreshCw } from 'lucide-react'

import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSortButton } from '@/components/ui/table-sort-button'
import { Spinner } from '@/components/ui/spinner'
import { useTableSorting } from '@/hooks/useTableSorting'
import { useRealEstateStore } from '@/stores'
import type {
  RealEstateListing,
  RealEstatePeriodFilter,
  RealEstateReportFormat,
} from '@/types/realEstate'

type ListingColumn = import('@/types').TableColumn<RealEstateListing>

const periodOptions: Array<{ value: RealEstatePeriodFilter; label: string }> = [
  { value: '24h', label: '24 часа' },
  { value: '3d', label: '3 дня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
]

const reportFormats: Array<{ value: RealEstateReportFormat; label: string }> = [
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

const sourceLabels: Record<string, string> = {
  AVITO: 'Авито',
  YOULA: 'Юла',
}

const formatPrice = (price?: number | null, currency?: string | null): string => {
  if (price === null || price === undefined) {
    return '—'
  }

  const formatted = new Intl.NumberFormat('ru-RU').format(price)
  return currency ? `${formatted} ${currency}` : formatted
}

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatSummaryDescription = (
  total: number,
  newToday: number,
  updatedToday: number,
): string => {
  if (!total) {
    return 'Пока нет объявлений. Как только появятся новые, они автоматически отобразятся здесь.'
  }

  return `Всего объявлений: ${total}. Новые за сутки — ${newToday}, обновлённые — ${updatedToday}.`
}

const columns: ListingColumn[] = [
  {
    header: 'Объявление',
    key: 'title',
    sortable: true,
    sortValue: (item) => item.title,
    render: (item) => (
      <div className="flex flex-col gap-1">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-semibold text-accent-primary transition-colors hover:text-accent-primary/80 hover:underline"
        >
          {item.title}
        </a>
        {item.description && (
          <p className="text-sm text-text-secondary/80 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    ),
  },
  {
    header: 'Источник',
    key: 'source',
    sortable: true,
    sortValue: (item) => item.source,
    render: (item) => (
      <Badge variant="secondary" className="w-fit">
        {sourceLabels[item.source] ?? item.source}
      </Badge>
    ),
  },
  {
    header: 'Цена',
    key: 'price',
    sortable: true,
    sortValue: (item) => item.price ?? null,
    render: (item) => (
      <span className="font-medium text-text-primary">
        {formatPrice(item.price, item.currency)}
      </span>
    ),
  },
  {
    header: 'Локация',
    key: 'address',
    sortable: true,
    sortValue: (item) => item.address ?? '',
    render: (item) => (
      <div className="flex flex-col gap-1 text-sm text-text-secondary">
        <span>{item.address ?? '—'}</span>
        {(item.rooms || item.area || item.floor) && (
          <span className="text-xs uppercase tracking-wide text-text-secondary/70">
            {[item.rooms, item.area, item.floor].filter(Boolean).join(' • ')}
          </span>
        )}
      </div>
    ),
  },
  {
    header: 'Опубликовано',
    key: 'postedAt',
    sortable: true,
    sortValue: (item) => (item.postedAt ? new Date(item.postedAt) : null),
    render: (item) => (
      <span className="text-sm text-text-secondary">{formatDateTime(item.postedAt)}</span>
    ),
  },
  {
    header: 'Проверено',
    key: 'checkedAt',
    sortable: true,
    sortValue: (item) => (item.checkedAt ? new Date(item.checkedAt) : null),
    render: (item) => (
      <span className="text-sm text-text-secondary">{formatDateTime(item.checkedAt ?? item.updatedAt)}</span>
    ),
  },
]

const renderCellValue = (
  column: ListingColumn,
  item: RealEstateListing,
  rowIndex: number,
): ReactNode => {
  if (typeof column.render === 'function') {
    return column.render(item, rowIndex)
  }

  const record = item as unknown as Record<string, unknown>
  const value = record[column.key]

  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (value instanceof Date) {
    return formatDateTime(value.toISOString())
  }

  return '—'
}

function RealEstateReports() {
  const listings = useRealEstateStore((state) => state.listings)
  const summary = useRealEstateStore((state) => state.summary)
  const filters = useRealEstateStore((state) => state.filters)
  const isLoading = useRealEstateStore((state) => state.isLoading)
  const isExporting = useRealEstateStore((state) => state.isExporting)
  const lastGeneratedAt = useRealEstateStore((state) => state.lastGeneratedAt)
  const setFilters = useRealEstateStore((state) => state.setFilters)
  const toggleSource = useRealEstateStore((state) => state.toggleSource)
  const fetchListings = useRealEstateStore((state) => state.fetchListings)
  const downloadReport = useRealEstateStore((state) => state.downloadReport)

  const [reportFormat, setReportFormat] = useState<RealEstateReportFormat>('xlsx')

  useEffect(() => {
    const load = async () => {
      try {
        await fetchListings()
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[RealEstateReports] fetchListings error', error)
        }
      }
    }

    void load()
  }, [fetchListings, filters])

  const stats = useMemo(() => {
    const total = summary?.total ?? 0
    const newToday = summary?.newToday ?? 0
    const updatedToday = summary?.updatedToday ?? 0

    return [
      {
        label: 'Всего объявлений',
        value: total.toLocaleString('ru-RU'),
      },
      {
        label: 'Новые за 24 часа',
        value: newToday.toLocaleString('ru-RU'),
      },
      {
        label: 'Обновлены за 24 часа',
        value: updatedToday.toLocaleString('ru-RU'),
      },
      {
        label: 'Последняя проверка',
        value: formatDateTime(summary?.lastSyncedAt ?? lastGeneratedAt),
      },
    ]
  }, [summary, lastGeneratedAt])

  const description = useMemo(() => {
    const total = summary?.total ?? 0
    const newToday = summary?.newToday ?? 0
    const updatedToday = summary?.updatedToday ?? 0

    return formatSummaryDescription(total, newToday, updatedToday)
  }, [summary])

  const { sortedItems, sortState, requestSort } = useTableSorting(listings, columns, {
    initialKey: 'postedAt',
    initialDirection: 'desc',
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeroCard
        title="Отчёты по недвижимости"
        description={description}
        actions={(
          <div className="flex flex-col gap-3 md:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Формат: {reportFormats.find((item) => item.value === reportFormat)?.label ?? reportFormat.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {reportFormats.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onSelect={() => setReportFormat(item.value)}
                    className={item.value === reportFormat ? 'text-accent-primary' : undefined}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => {
                void downloadReport({ format: reportFormat })
              }}
              disabled={isExporting || listings.length === 0}
            >
              {isExporting ? (
                <>
                  <Spinner className="size-4" />
                  Формирование...
                </>
              ) : (
                <>
                  <FileDown className="size-4" />
                  Сохранить отчёт
                </>
              )}
            </Button>
          </div>
        )}
        footer={
          <span className="text-sm text-text-secondary">
            Обновлено: {formatDateTime(lastGeneratedAt)}
          </span>
        }
      />

      <SectionCard
        title="Фильтры"
        description="Уточните период проверки, источник объявлений и выделите только новые результаты."
        headerActions={
          <Button
            variant="ghost"
            onClick={() => {
              void fetchListings()
            }}
            disabled={isLoading}
          >
            <RefreshCw className="size-4" />
            Обновить
          </Button>
        }
        contentClassName="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Период анализа
          </span>
          <ButtonGroup>
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={filters.period === option.value ? 'default' : 'outline'}
                onClick={() => setFilters({ period: option.value })}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Источники
          </span>
          <ButtonGroup>
            {(['AVITO', 'YOULA'] as const).map((source) => (
              <Button
                key={source}
                variant={filters.sources.includes(source) ? 'default' : 'outline'}
                onClick={() => toggleSource(source)}
              >
                {sourceLabels[source]}
              </Button>
            ))}
            <ButtonGroupSeparator />
            <Button
              variant={filters.onlyNew ? 'default' : 'outline'}
              onClick={() => setFilters({ onlyNew: !filters.onlyNew })}
            >
              Только новые
            </Button>
          </ButtonGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Лента объявлений"
        description="Последние объявления о сдаче недвижимости с Авито и Юлы."
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="bg-muted/40">
                    {column.sortable ? (
                      <TableSortButton
                        direction={sortState?.key === column.key ? sortState.direction : null}
                        onClick={() => requestSort(column.key)}
                      >
                        {column.header}
                      </TableSortButton>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-text-secondary">
                      <Spinner className="size-8" />
                      <span>Загружаем объявления…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-12 text-center text-text-secondary">
                    За выбранный период объявлений не найдено.
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item, rowIndex) => (
                  <TableRow key={`${item.source}-${item.id}`} className="hover:bg-muted/60">
                    {columns.map((column) => (
                      <TableCell key={column.key} className="align-top text-sm text-text-primary">
                        {renderCellValue(column, item, rowIndex)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard
        title="Сводка"
        description="Ключевые показатели по объявлениям за выбранный период."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/60 bg-background-primary/70 p-4 shadow-soft-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary/70">
                {item.label}
              </span>
              <p className="mt-3 text-2xl font-semibold text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

export default RealEstateReports
