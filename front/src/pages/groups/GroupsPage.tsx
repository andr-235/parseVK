import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RefreshCw, Download, X } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { TableShell } from '../../components/widgets/table/TableShell'
import { TableHead } from '../../components/widgets/table/TableHead'
import { TableSkeleton } from '../../components/widgets/table/TableSkeleton'
import { EmptyState } from '../../components/widgets/table/EmptyState'
import { PaginationBar } from '../../components/widgets/table/PaginationBar'
import { FeedbackToast } from '../../components/widgets/table/FeedbackToast'
import { TableError } from '../../components/widgets/table/TableError'
import type { Column } from '../../components/widgets/table/constants'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { useSelection } from '../../shared/hooks/useSelection'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { useTableKeyboardNavigation } from '../../shared/hooks/useTableKeyboardNavigation'
import { GroupRow } from './components/GroupRow'
import type { ActionState } from './components/GroupRow'
import { RegionSearchWidget } from './components/RegionSearchWidget'
import {
  fetchGroups,
  deleteGroup,
  type Group,
} from '../../shared/api/groups'

const PAGE_SIZE = 25

const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  screenName: 'screenName',
  updatedAt: 'updatedAt',
}

type SortConfig = { key: string; dir: 'asc' | 'desc' }

const columns: Column[] = [
  { key: 'avatar', label: '', className: 'w-12', sortable: false },
  { key: 'name', label: 'Название', sortable: true },
  { key: 'type', label: 'Тип', className: 'w-24', sortable: false },
  { key: 'membersCount', label: 'Участники', className: 'w-24', sortable: false },
  { key: 'city', label: 'Город', className: 'w-28', sortable: false },
  { key: 'verified', label: 'Вериф.', className: 'w-20', sortable: false },
  { key: 'updatedAt', label: 'Обновлено', className: 'w-24', sortable: true },
  { key: 'actions', label: 'Действия', sortable: false },
]

function exportToCsv(items: Group[]) {
  const header = 'ID;Название;Screen Name;Тип;Участники;Город;Верифицирован;Обновлено'
  const rows = items.map((g) =>
    [
      g.vkGroupId,
      g.name || '',
      g.screenName || '',
      g.type || '',
      g.membersCount ?? '',
      g.city?.title || '',
      g.verified ? 'Да' : 'Нет',
      g.updatedAt ? new Date(g.updatedAt).toLocaleDateString('ru-RU') : '',
    ].join(';'),
  )
  const bom = '\uFEFF'
  const blob = new Blob([bom + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `groups-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function GroupsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [sort, setSort] = useState<SortConfig>({ key: 'updatedAt', dir: 'desc' })
  const [actionState, setActionState] = useState<ActionState>({
    deleting: null,
    confirmDelete: null,
  })
  const [undoData, setUndoData] = useState<{ group: Group } | null>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { selected, toggle, toggleAll, clear, count } = useSelection<number>()

  const debouncedSearch = useDebounce(search, 300)

  const queryKey = ['groups', { search: debouncedSearch, page, limit: pageSize, sortBy: SORT_FIELD_MAP[sort.key], sortOrder: sort.dir }]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchGroups({
      search: debouncedSearch || undefined,
      page,
      limit: pageSize,
      sortBy: SORT_FIELD_MAP[sort.key] ?? undefined,
      sortOrder: sort.dir,
    }),
  })

  const filtered = data?.items ?? []

  const { feedback, showFeedback, dismissFeedback } = useFeedback()
  const { focusedRow } = useTableKeyboardNavigation(filtered.length)

  const invalidateGroups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['groups'] })
  }, [queryClient])

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      invalidateGroups()
      setActionState((prev) => ({ ...prev, deleting: null, confirmDelete: null }))
      clear()
      showFeedback('success', 'Группа удалена')
      setUndoData(null)
    },
    onError: (err) => {
      setActionState((prev) => ({ ...prev, deleting: null, confirmDelete: null }))
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка удаления')
      setUndoData(null)
    },
  })

  const runBatch = useCallback(async (ids: number[], fn: (id: number) => Promise<void>) => {
    for (const id of ids) await fn(id)
  }, [])

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => runBatch(ids, deleteGroup),
    onSuccess: () => {
      invalidateGroups()
      clear()
      showFeedback('success', 'Выбранные группы удалены')
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка пакетного удаления')
    },
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  const allIds = useMemo(() => data?.items.map((g) => g.vkGroupId) ?? [], [data])

  const handleSort = useCallback((key: string) => {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setPage(1)
  }, [])

  const handleDelete = useCallback((id: number) => {
    const group = filtered.find((g) => g.vkGroupId === id)
    if (!group) return
    setActionState((prev) => ({ ...prev, deleting: id }))
    setUndoData({ group })
    undoRef.current = setTimeout(() => {
      deleteMutation.mutate(id)
    }, 5000)
  }, [filtered])

  const handleConfirmDelete = useCallback((id: number) => {
    setActionState((prev) => ({ ...prev, confirmDelete: id }))
  }, [])

  const handleCancelDelete = useCallback(() => {
    setActionState((prev) => ({ ...prev, confirmDelete: null }))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!filtered.length) return
      if (e.key === 'Delete' && focusedRow >= 0) {
        const group = filtered[focusedRow]
        if (group && actionState.confirmDelete !== group.vkGroupId) {
          e.preventDefault()
          handleConfirmDelete(group.vkGroupId)
        }
      } else if (e.key === 'Escape') {
        handleCancelDelete()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [filtered, focusedRow, actionState.confirmDelete, handleConfirmDelete, handleCancelDelete])

  const handleUndo = useCallback(() => {
    if (undoRef.current) clearTimeout(undoRef.current)
    setUndoData(null)
    setActionState((prev) => ({ ...prev, deleting: null, confirmDelete: null }))
    showFeedback('success', 'Удаление отменено')
  }, [])

  const handleBatch = useCallback((fn: (ids: number[]) => void) => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    fn(ids)
  }, [selected])

  const handleGroupSaved = useCallback(() => {
    invalidateGroups()
  }, [invalidateGroups])

  return (
    <PageShell title="Группы">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              ;(e.target as HTMLInputElement).blur()
              resetFilters()
            }
          }}
          placeholder="Поиск групп..."
          aria-label="Поиск групп"
        />
        <Button variant="secondary" size="xs" onClick={resetFilters} aria-label="Сбросить поиск" icon={<X size={12} />}>
          Сбросить
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary" size="xs"
            onClick={() => exportToCsv(filtered)}
            aria-label="Экспортировать в CSV"
            icon={<Download size={14} />}
          >
            Экспорт
          </Button>
          <Button
            variant="secondary" size="xs"
            onClick={() => refetch()}
            disabled={isLoading}
            icon={<RefreshCw size={14} />}
          >
            Обновить
          </Button>
        </div>
      </div>

      <RegionSearchWidget onGroupSaved={handleGroupSaved} />

      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />

      {undoData && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 text-xs" role="status">
          <span className="text-text-secondary">{undoData.group.name || 'Группа'} будет удалена через 5с</span>
          <Button variant="soft" size="xs" semantic="default" onClick={handleUndo} icon={<X size={12} />}>
            Отменить
          </Button>
        </div>
      )}

      {data && !isLoading && !isError && filtered.length > 0 && (
        <p className="mb-3 text-xs text-text-muted">Всего групп: {data.total.toLocaleString('ru-RU')}</p>
      )}

      {count > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 text-xs" role="toolbar" aria-label="Действия с выбранными">
          <span className="text-text-muted mr-1">{count} выбрано:</span>
          <Button variant="soft" semantic="danger" size="xs" onClick={() => handleBatch(batchDeleteMutation.mutate)} disabled={batchDeleteMutation.isPending} icon={<Trash2 size={12} />}>
            Удалить
          </Button>
          <div className="ml-auto">
            <Button variant="ghost" size="xs" semantic="default" onClick={clear} icon={<X size={12} />}>Снять</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <TableError
          columns={columns}
          message={error instanceof Error ? error.message : 'Произошла ошибка'}
          onRetry={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            search
              ? 'Ничего не найдено'
              : 'Нет групп. Добавьте группы через поиск VK или загрузите файл.'
          }
          onReset={search ? resetFilters : undefined}
        />
      ) : (
        <>
          <TableShell>
            <TableHead
              columns={columns}
              sort={sort}
              onSort={handleSort}
              allChecked={count === filtered.length && filtered.length > 0}
              onToggleAll={() => toggleAll(allIds)}
            />
            <tbody>
              {filtered.map((group, index) => (
                <GroupRow
                  key={group.vkGroupId}
                  group={group}
                  checked={selected.has(group.vkGroupId)}
                  actionState={actionState}
                  isFocused={focusedRow === index}
                  onDelete={handleDelete}
                  onConfirmDelete={handleConfirmDelete}
                  onCancelDelete={handleCancelDelete}
                  onToggle={toggle}
                />
              ))}
            </tbody>
          </TableShell>
          {data && data.total > pageSize && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={data.total}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s)
                setPage(1)
              }}
            />
          )}
        </>
      )}
    </PageShell>
  )
}