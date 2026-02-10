import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import type { IListing } from '@/shared/types'
import type { ListingsSortField } from '@/modules/listings/types/listingsTypes'
import {
  formatSourceLabel,
  formatPriceValue,
  formatDateShort,
  buildParamsString,
} from '@/modules/listings/utils/listingsUtils'
import {
  ExternalLink,
  StickyNote,
  Archive,
  Trash2,
  Columns3,
  ArchiveRestore,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'
import { cn } from '@/shared/utils'

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMN_DEFS = [
  {
    id: 'source' as const,
    label: 'Источник',
    hideable: true,
    sortField: 'source' as ListingsSortField,
  },
  {
    id: 'title' as const,
    label: 'Заголовок',
    hideable: false,
    sortField: 'title' as ListingsSortField,
  },
  { id: 'price' as const, label: 'Цена', hideable: true, sortField: 'price' as ListingsSortField },
  { id: 'params' as const, label: 'Параметры', hideable: true, sortField: null },
  {
    id: 'address' as const,
    label: 'Адрес',
    hideable: true,
    sortField: 'address' as ListingsSortField,
  },
  {
    id: 'contact' as const,
    label: 'Контакт',
    hideable: true,
    sortField: 'sourceAuthorName' as ListingsSortField,
  },
  {
    id: 'date' as const,
    label: 'Дата',
    hideable: true,
    sortField: 'publishedAt' as ListingsSortField,
  },
  {
    id: 'parsedAt' as const,
    label: 'Дата парсинга',
    hideable: true,
    sortField: 'sourceParsedAt' as ListingsSortField,
  },
  { id: 'actions' as const, label: '', hideable: false, sortField: null },
] as const

type ColumnId = (typeof COLUMN_DEFS)[number]['id']

const DEFAULT_HIDDEN_COLUMNS = new Set<ColumnId>(['params'])

// ─── Props ────────────────────────────────────────────────────────────────────

interface ListingsTableProps {
  items: IListing[]
  loading: boolean
  initialLoading: boolean
  sortBy?: ListingsSortField
  sortOrder?: 'asc' | 'desc'
  onAddNote: (listing: IListing) => void
  onArchive: (listing: IListing) => void | Promise<void>
  onDelete: (listing: IListing) => void | Promise<void>
  onSortChange: (field: ListingsSortField) => void
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, order }: { active: boolean; order: 'asc' | 'desc' | undefined }) {
  if (!active) return <ChevronsUpDown className="size-3 opacity-30" />
  if (order === 'asc') return <ChevronUp className="size-3 text-cyan-400" />
  return <ChevronDown className="size-3 text-cyan-400" />
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3.5 w-full max-w-[100px] bg-white/5" />
        </td>
      ))}
    </tr>
  )
}

// ─── Single row ───────────────────────────────────────────────────────────────

interface RowProps {
  listing: IListing
  visibleColumns: Set<ColumnId>
  confirmDeleteId: number | null
  onConfirmDeleteRequest: (id: number) => void
  onConfirmDeleteCancel: () => void
  onConfirmDeleteExecute: (listing: IListing) => void
  onAddNote: (listing: IListing) => void
  onArchive: (listing: IListing) => void | Promise<void>
}

function ListingRow({
  listing,
  visibleColumns,
  confirmDeleteId,
  onConfirmDeleteRequest,
  onConfirmDeleteCancel,
  onConfirmDeleteExecute,
  onAddNote,
  onArchive,
}: RowProps) {
  const isPendingDelete = confirmDeleteId === listing.id

  const params = useMemo(() => buildParamsString(listing), [listing])
  const price = useMemo(
    () => formatPriceValue(listing.price, listing.currency),
    [listing.price, listing.currency]
  )
  const date = useMemo(
    () => formatDateShort(listing.publishedAt ?? listing.sourcePostedAt),
    [listing.publishedAt, listing.sourcePostedAt]
  )
  const parsedAt = useMemo(
    () => formatDateShort(listing.sourceParsedAt ?? listing.createdAt),
    [listing.sourceParsedAt, listing.createdAt]
  )
  const source = useMemo(() => formatSourceLabel(listing.source), [listing.source])
  const location = useMemo(() => {
    const parts = [listing.city, listing.address].filter(Boolean)
    return parts.join(', ') || '—'
  }, [listing.city, listing.address])
  const contact = useMemo(() => {
    const parts = [
      listing.sourceAuthorName ?? listing.contactName,
      listing.sourceAuthorPhone ?? listing.contactPhone,
    ].filter(Boolean)
    return parts.join(' · ') || '—'
  }, [
    listing.sourceAuthorName,
    listing.contactName,
    listing.sourceAuthorPhone,
    listing.contactPhone,
  ])

  return (
    <tr
      className={cn(
        'border-b border-white/5 transition-colors hover:bg-white/[0.03]',
        isPendingDelete && 'bg-red-500/[0.06] border-red-500/20',
        listing.archived && 'opacity-50'
      )}
    >
      {visibleColumns.has('source') && (
        <td className="px-4 py-3 whitespace-nowrap">
          {listing.source ? (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-800/60 px-2 py-0.5 font-mono-accent text-xs text-slate-400">
              {source}
            </span>
          ) : (
            <span className="font-mono-accent text-xs text-slate-600">—</span>
          )}
        </td>
      )}

      <td className="px-4 py-3 w-[300px] max-w-[300px] overflow-hidden">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-start gap-1.5 min-w-0">
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-sm font-medium text-slate-200 leading-snug transition-colors duration-200 hover:text-cyan-400 min-w-0 break-words"
              title={listing.title ?? listing.url}
            >
              {listing.title ?? listing.url}
            </a>
            <ExternalLink className="mt-0.5 size-3 shrink-0 text-slate-600" />
          </div>
          {listing.manualNote && (
            <p className="text-xs text-amber-400/70 italic leading-snug break-words">
              {listing.manualNote}
            </p>
          )}
        </div>
      </td>

      {visibleColumns.has('price') && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono-accent text-sm font-semibold text-cyan-400">
            {listing.price != null ? price : <span className="text-slate-600">—</span>}
          </span>
        </td>
      )}

      {visibleColumns.has('params') && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono-accent text-xs text-slate-400">{params || '—'}</span>
        </td>
      )}

      {visibleColumns.has('address') && (
        <td className="px-4 py-3 max-w-[200px]">
          <span className="line-clamp-2 text-xs text-slate-400">{location}</span>
        </td>
      )}

      {visibleColumns.has('contact') && (
        <td className="px-4 py-3 max-w-[180px]">
          <span className="line-clamp-2 text-xs text-slate-400">{contact}</span>
        </td>
      )}

      {visibleColumns.has('date') && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono-accent text-xs text-slate-500">{date}</span>
        </td>
      )}

      {visibleColumns.has('parsedAt') && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono-accent text-xs text-slate-500">{parsedAt}</span>
        </td>
      )}

      <td className="px-4 py-3">
        {isPendingDelete ? (
          <div className="flex items-center gap-2">
            <span className="font-mono-accent text-xs text-red-400 whitespace-nowrap">
              Удалить?
            </span>
            <button
              className="h-6 rounded-md bg-red-500/80 px-2 font-mono-accent text-xs text-white transition-colors hover:bg-red-500"
              onClick={() => onConfirmDeleteExecute(listing)}
            >
              Да
            </button>
            <button
              className="h-6 rounded-md border border-white/10 px-2 font-mono-accent text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              onClick={onConfirmDeleteCancel}
            >
              Нет
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <button
              className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-slate-300"
              title="Добавить заметку"
              onClick={() => onAddNote(listing)}
            >
              <StickyNote className="size-3.5" />
            </button>
            <button
              className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-slate-300"
              title={listing.archived ? 'Восстановить из архива' : 'В архив'}
              onClick={() => onArchive(listing)}
            >
              {listing.archived ? (
                <ArchiveRestore className="size-3.5" />
              ) : (
                <Archive className="size-3.5" />
              )}
            </button>
            <button
              className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
              title="Удалить"
              onClick={() => onConfirmDeleteRequest(listing.id)}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Column toggle ────────────────────────────────────────────────────────────

interface ColumnToggleProps {
  hiddenColumns: Set<ColumnId>
  onToggle: (id: ColumnId) => void
}

function ColumnToggle({ hiddenColumns, onToggle }: ColumnToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 border border-white/10 bg-slate-800/50 font-mono-accent text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <Columns3 className="size-3.5" />
          Столбцы
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 border-white/10 bg-slate-900/95 backdrop-blur-2xl"
      >
        <DropdownMenuLabel className="font-mono-accent text-xs uppercase tracking-wider text-slate-400">
          Показать столбцы
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {COLUMN_DEFS.filter((col) => col.hideable).map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={!hiddenColumns.has(col.id)}
            onCheckedChange={() => onToggle(col.id)}
            className="font-mono-accent text-xs text-slate-300 focus:bg-white/5 focus:text-white"
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ListingsTable({
  items,
  loading,
  initialLoading,
  sortBy,
  sortOrder,
  onAddNote,
  onArchive,
  onDelete,
  onSortChange,
}: ListingsTableProps) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnId>>(DEFAULT_HIDDEN_COLUMNS)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const visibleColumns = useMemo<Set<ColumnId>>(
    () => new Set(COLUMN_DEFS.map((c) => c.id).filter((id) => !hiddenColumns.has(id))),
    [hiddenColumns]
  )

  const handleToggleColumn = useCallback((id: ColumnId) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleConfirmDeleteExecute = useCallback(
    async (listing: IListing) => {
      setConfirmDeleteId(null)
      await onDelete(listing)
    },
    [onDelete]
  )

  const skeletonCount = initialLoading ? 10 : 3
  const visibleColCount = visibleColumns.size

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <ColumnToggle hiddenColumns={hiddenColumns} onToggle={handleToggleColumn} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full font-monitoring-body">
            <thead className="bg-slate-800/50">
              <tr>
                {COLUMN_DEFS.filter((col) => visibleColumns.has(col.id)).map((col) => {
                  const isSortable = col.sortField !== null
                  const isActive = isSortable && sortBy === col.sortField

                  return (
                    <th
                      key={col.id}
                      className={cn(
                        'px-4 py-3 text-left font-monitoring-display text-xs font-medium uppercase tracking-wider text-slate-400',
                        isSortable &&
                          'cursor-pointer select-none transition-colors duration-200 hover:text-slate-200',
                        isActive && 'text-cyan-400'
                      )}
                      onClick={
                        isSortable && col.sortField
                          ? () => onSortChange(col.sortField as ListingsSortField)
                          : undefined
                      }
                    >
                      {col.label ? (
                        <div className="flex items-center gap-1">
                          {col.label}
                          {isSortable && (
                            <SortIcon active={isActive} order={isActive ? sortOrder : undefined} />
                          )}
                        </div>
                      ) : null}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {initialLoading
                ? Array.from({ length: skeletonCount }).map((_, i) => (
                    <SkeletonRow key={i} colCount={visibleColCount} />
                  ))
                : items.map((listing) => (
                    <ListingRow
                      key={listing.id}
                      listing={listing}
                      visibleColumns={visibleColumns}
                      confirmDeleteId={confirmDeleteId}
                      onConfirmDeleteRequest={setConfirmDeleteId}
                      onConfirmDeleteCancel={() => setConfirmDeleteId(null)}
                      onConfirmDeleteExecute={handleConfirmDeleteExecute}
                      onAddNote={onAddNote}
                      onArchive={onArchive}
                    />
                  ))}

              {!initialLoading &&
                loading &&
                items.length > 0 &&
                Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonRow key={`loading-${i}`} colCount={visibleColCount} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
