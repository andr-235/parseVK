import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { IListing, TableColumn } from '@/types/common'
import type { ListingsSortField } from '@/types/listings/listingsTypes'
import {
  formatSourceLabel,
  formatPriceValue,
  formatDateShort,
  buildParamsString,
} from '@/utils/listings/listingsUtils'
import {
  ExternalLink,
  StickyNote,
  Archive,
  Trash2,
  Columns3,
  ArchiveRestore,
  Pencil,
} from 'lucide-react'
import { cn } from '@/utils/common'
import { DataTable } from '@/components/common/DataTable'

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
    id: 'phone' as const,
    label: 'Номер телефона',
    hideable: true,
    sortField: 'contactPhone' as ListingsSortField,
  },
  {
    id: 'authorUrl' as const,
    label: 'URL автора',
    hideable: false,
    sortField: 'sourceAuthorUrl' as ListingsSortField,
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
  isArchivedView?: boolean
  sortBy?: ListingsSortField
  sortOrder?: 'asc' | 'desc'
  onAddNote: (listing: IListing) => void
  onEdit: (listing: IListing) => void
  onArchive: (listing: IListing) => void | Promise<void>
  onDelete: (listing: IListing) => void | Promise<void>
  onSortChange: (field: ListingsSortField) => void
}

// ─── Author URL cell ──────────────────────────────────────────────────────────

function AuthorUrlCell({ url }: { url: string }) {
  return (
    <span className="break-all font-mono text-[11px] text-slate-400 leading-relaxed w-[220px] block">
      {url}
    </span>
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
          className="gap-1.5 border border-[#2a2a30] bg-[#1c1c21] font-mono-accent text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
  isArchivedView = false,
  sortBy,
  sortOrder,
  onAddNote,
  onEdit,
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

  const columns = useMemo<TableColumn<IListing>[]>(() => {
    const colDefs: TableColumn<IListing>[] = [
      {
        header: 'Источник',
        key: 'source',
        sortable: true,
        render: (listing) => {
          const source = formatSourceLabel(listing.source)
          return listing.source ? (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-800/60 px-2 py-0.5 font-mono-accent text-xs text-slate-400">
              {source}
            </span>
          ) : (
            <span className="font-mono-accent text-xs text-slate-600">—</span>
          )
        }
      },
      {
        header: 'Заголовок',
        key: 'title',
        sortable: true,
        cellClassName: 'w-[300px] max-w-[300px] overflow-hidden',
        render: (listing) => {
          return (
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-start gap-1.5 min-w-0">
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-sm font-medium text-slate-200 leading-snug transition-colors duration-200 hover:text-primary min-w-0 break-words"
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
          )
        }
      },
      {
        header: 'Цена',
        key: 'price',
        sortable: true,
        render: (listing) => {
          const price = formatPriceValue(listing.price, listing.currency)
          return (
            <span className="font-mono-accent text-sm font-semibold text-primary">
              {listing.price != null ? price : <span className="text-slate-600">—</span>}
            </span>
          )
        }
      },
      {
        header: 'Параметры',
        key: 'params',
        render: (listing) => {
          const params = buildParamsString(listing)
          return <span className="font-mono-accent text-xs text-slate-400">{params || '—'}</span>
        }
      },
      {
        header: 'Адрес',
        key: 'address',
        sortable: true,
        cellClassName: 'max-w-[200px]',
        render: (listing) => {
          const parts = [listing.city, listing.address].filter(Boolean)
          const location = parts.join(', ') || '—'
          return <span className="line-clamp-2 text-xs text-slate-400">{location}</span>
        }
      },
      {
        header: 'Контакт',
        key: 'contact',
        sortable: true,
        cellClassName: 'max-w-[180px]',
        render: (listing) => {
          const contact = listing.sourceAuthorName ?? listing.contactName ?? '—'
          return <span className="line-clamp-2 text-xs text-slate-400">{contact}</span>
        }
      },
      {
        header: 'Номер телефона',
        key: 'phone',
        sortable: true,
        render: (listing) => {
          const phone = listing.sourceAuthorPhone ?? listing.contactPhone ?? '—'
          return <span className="font-mono-accent text-xs text-slate-400">{phone}</span>
        }
      },
      {
        header: 'URL автора',
        key: 'authorUrl',
        sortable: true,
        render: (listing) => {
          return listing.sourceAuthorUrl ? (
            <AuthorUrlCell url={listing.sourceAuthorUrl} />
          ) : (
            <span className="font-mono-accent text-xs text-slate-600">—</span>
          )
        }
      },
      {
        header: 'Дата',
        key: 'date',
        sortable: true,
        render: (listing) => {
          const date = formatDateShort(listing.publishedAt ?? listing.sourcePostedAt)
          return <span className="font-mono-accent text-xs text-slate-500">{date}</span>
        }
      },
      {
        header: 'Дата парсинга',
        key: 'parsedAt',
        sortable: true,
        render: (listing) => {
          const parsedAt = formatDateShort(listing.sourceParsedAt ?? listing.createdAt)
          return <span className="font-mono-accent text-xs text-slate-500">{parsedAt}</span>
        }
      },
      {
        header: '',
        key: 'actions',
        render: (listing) => {
          const isPendingDelete = confirmDeleteId === listing.id
          return isPendingDelete ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="font-mono-accent text-xs text-red-400 whitespace-nowrap">
                Удалить?
              </span>
              <button
                className="h-6 rounded-md bg-red-500/80 px-2 font-mono-accent text-xs text-white transition-colors hover:bg-red-500"
                onClick={() => handleConfirmDeleteExecute(listing)}
              >
                Да
              </button>
              <button
                className="h-6 rounded-md border border-white/10 px-2 font-mono-accent text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setConfirmDeleteId(null)}
              >
                Нет
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-slate-300"
                title="Редактировать"
                onClick={() => onEdit(listing)}
              >
                <Pencil className="size-3.5" />
              </button>
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
                onClick={() => setConfirmDeleteId(listing.id)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )
        }
      }
    ]

    return colDefs.filter((col) => col.key === 'actions' || visibleColumns.has(col.key as ColumnId))
  }, [
    visibleColumns,
    confirmDeleteId,
    handleConfirmDeleteExecute,
    onEdit,
    onAddNote,
    onArchive
  ])

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <ColumnToggle hiddenColumns={hiddenColumns} onToggle={handleToggleColumn} />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <DataTable
          data={items}
          columns={columns}
          isLoading={initialLoading || (loading && items.length === 0)}
          loadingRowsCount={initialLoading ? 10 : 3}
          sortState={sortBy ? { key: sortBy, direction: sortOrder ?? 'desc' } : null}
          onRequestSort={(key) => {
            const def = COLUMN_DEFS.find((c) => c.id === key)
            if (def && def.sortField) {
              onSortChange(def.sortField)
            }
          }}
          rowClassName={(listing) => cn(
            confirmDeleteId === listing.id && 'bg-red-500/[0.06] border-red-500/20',
            listing.archived && !isArchivedView && 'opacity-50'
          )}
        />
      </div>
    </div>
  )
}
