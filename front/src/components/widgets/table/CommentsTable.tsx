import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { useSelection } from '../../../shared/hooks/useSelection'
import { useComments } from '../../../shared/hooks/useComments'
import { FilterToolbar } from './FilterToolbar'
import { TableShell } from './TableShell'
import { TableHead } from './TableHead'
import { TableBody } from './TableBody'
import { PaginationBar } from './PaginationBar'
import { UndoBar } from './UndoBar'
import { BatchActionBar } from './BatchActionBar'
import { StatusLegend } from './StatusLegend'
import { EmptyState } from './EmptyState'
import { TableSkeleton } from './TableSkeleton'
import { type Status, type Comment, type UndoEntry } from '../../../types/comments'
import type { Column } from './constants'

export type SortKey = 'text' | 'group' | 'author' | 'date' | 'status'
export type SortDir = 'asc' | 'desc'
export type SortConfig = { key: SortKey; dir: SortDir }

const commentColumns: Column[] = [
  { key: 'text', label: 'Текст', sortable: true },
  { key: 'group', label: 'Группа', sortable: true, hide: 'hidden sm:table-cell' },
  { key: 'author', label: 'Автор', sortable: true, hide: 'hidden sm:table-cell' },
  { key: 'date', label: 'Дата', sortable: true, hide: 'hidden md:table-cell' },
  { key: 'status', label: 'Статус', sortable: true },
]

type CommentsTableProps = {
  onSelect: (c: Comment) => void
  selectedId: number | null
  onError?: (msg: string | null) => void
}

export function CommentsTable({ onSelect, selectedId, onError }: CommentsTableProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [groupFilter, setGroupFilter] = useState('Все группы')
  const [statusFilter, setStatusFilter] = useState('Все статусы')
  const [sort, setSort] = useState<SortConfig>({ key: 'date', dir: 'desc' })
  const [undo, setUndo] = useState<UndoEntry | null>(null)
  const [localComments, setLocalComments] = useState<Comment[]>([])
  const tableRef = useRef<HTMLDivElement>(null)

  const query = useComments({ page, pageSize, search: debouncedSearch })
  const { selected, toggle, toggleAll, clear, deselect, count } = useSelection<number>()

  useEffect(() => {
    if (query.data) setLocalComments(query.data.comments)
  }, [query.data])

  useEffect(() => {
    onError?.(query.isError ? (query.error instanceof Error ? query.error.message : 'Ошибка загрузки') : null)
  }, [query.isError, query.error, onError])

  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleSort = useCallback((key: string) => {
    setSort((prev) => prev.key === key ? { key: key as SortKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key: key as SortKey, dir: 'asc' })
  }, [])

  const paged = useMemo(() => {
    let items = localComments
    if (groupFilter !== 'Все группы') items = items.filter((c) => c.group === groupFilter)
    if (statusFilter !== 'Все статусы') items = items.filter((c) => c.status === statusFilter)
    return [...items].sort((a, b) => {
      const av = String(a[sort.key] ?? '')
      const bv = String(b[sort.key] ?? '')
      const cmp = av.localeCompare(bv, 'ru')
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [localComments, groupFilter, statusFilter, sort])

  const pagedRef = useRef(paged)
  pagedRef.current = paged

  useEffect(() => { if (!undo) return; const t = setTimeout(() => setUndo(null), 4000); return () => clearTimeout(t) }, [undo])

  const applyUndo = useCallback(() => {
    if (!undo) return
    setLocalComments((prev) => prev.map((c) => (undo.ids.includes(c.id) ? { ...c, status: undo.from } : c)))
    setUndo(null)
  }, [undo])

  const updateStatus = useCallback((ids: number[], newStatus: Status, recordUndo = false) => {
    setLocalComments((prev) => {
      const affected = prev.filter((c) => ids.includes(c.id))
      if (affected.every((c) => c.status === newStatus)) return prev
      if (recordUndo && affected.length > 0) {
        const froms = new Set(affected.map((c) => c.status))
        if (froms.size === 1) setUndo({ ids, from: [...froms][0], to: newStatus })
      }
      return prev.map((c) => (ids.includes(c.id) ? { ...c, status: newStatus } : c))
    })
    deselect(ids)
  }, [deselect])

  const updateSingleStatus = useCallback((id: number, newStatus: Status) => {
    setLocalComments((prev) => {
      const c = prev.find((x) => x.id === id)
      if (!c || c.status === newStatus) return prev
      return prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x))
    })
  }, [])

  const handleToggleAll = useCallback(() => toggleAll(paged.map((c) => c.id)), [toggleAll, paged])
  const resetFilters = useCallback(() => { setSearch(''); setGroupFilter('Все группы'); setStatusFilter('Все статусы'); setPage(1) }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const rows = pagedRef.current
    const idx = focusedIndex
    if (rows.length === 0) return

    const advance = (delta: number) => {
      const next = Math.max(0, Math.min(idx + delta, rows.length - 1))
      setFocusedIndex(next)
      onSelect(rows[next])
    }

    const applyAndAdvance = (s: Status) => {
      const c = rows[idx]; if (!c) return
      updateSingleStatus(c.id, s)
      const next = Math.min(idx + 1, rows.length - 1)
      setFocusedIndex(next); onSelect(rows[next])
    }

    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); advance(1); break
      case 'ArrowUp': e.preventDefault(); advance(-1); break
      case ' ': e.preventDefault(); { const c = rows[idx]; if (c) toggle(c.id) } break
      case 'c': case 'C': e.preventDefault(); applyAndAdvance('Чисто'); break
      case 'v': case 'V': e.preventDefault(); applyAndAdvance('Нарушение'); break
      case 'r': case 'R': e.preventDefault(); applyAndAdvance('Проверка'); break
    }
  }, [focusedIndex, onSelect, toggle, updateSingleStatus])

  if (query.isLoading && localComments.length === 0) return <TableSkeleton />

  return (
    <div className="flex flex-1 flex-col min-w-0" role="region" aria-label="Комментарии">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {undo ? `Статус изменён с ${undo.from} на ${undo.to}. Нажмите кнопку отменить.` : ''}
      </div>

      <FilterToolbar
        search={search} onSearchChange={setSearch}
        groupFilter={groupFilter} onGroupFilterChange={(v) => { setGroupFilter(v); setPage(1) }}
        statusFilter={statusFilter} onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1) }}
        onReset={resetFilters} selectedCount={count}
      />

      {undo && <UndoBar undo={undo} onApply={applyUndo} />}

      {count > 1 && (
        <BatchActionBar
          count={count}
          onChange={(s) => updateStatus(Array.from(selected), s as Status, true)}
          onClear={clear}
        />
      )}

      {paged.length === 0 ? (
        <EmptyState onReset={resetFilters} />
      ) : (
        <>
          <TableShell tableRef={tableRef} onKeyDown={handleKeyDown} ariaLabel="Таблица комментариев. Используйте стрелки для навигации, C/V/R для статусов.">
            <TableHead columns={commentColumns} allChecked={count === paged.length} onToggleAll={handleToggleAll} sort={sort} onSort={handleSort} />
            <TableBody
              rows={paged} selectedId={selectedId} focusedIndex={focusedIndex}
              selectedRows={selected} onSelect={onSelect}
              onToggleRow={toggle} onStatusChange={updateSingleStatus}
            />
          </TableShell>
          <StatusLegend />
          {totalPages > 1 && (
            <PaginationBar
              page={page} totalPages={totalPages} pageSize={pageSize}
              totalItems={total} onPageChange={setPage}
              onPageSizeChange={(v) => { setPageSize(v); setPage(1) }}
            />
          )}
        </>
      )}
    </div>
  )
}
