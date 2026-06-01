import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RefreshCw, BadgeCheck, Download, X, Check } from 'lucide-react'
import { Button, Input, Select } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { TableShell } from '../../components/widgets/table/TableShell'
import { TableHead } from '../../components/widgets/table/TableHead'
import { TableSkeleton } from '../../components/widgets/table/TableSkeleton'
import { EmptyState } from '../../components/widgets/table/EmptyState'
import { PaginationBar } from '../../components/widgets/table/PaginationBar'
import type { Column } from '../../components/widgets/table/constants'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { useSelection } from '../../shared/hooks/useSelection'
import { AuthorRow } from './components/AuthorRow'
import type { ActionState } from './components/AuthorRow'
import {
  fetchAuthors,
  verifyAuthor,
  deleteAuthor,
  refreshAuthors,
  type Author,
} from '../../shared/api/authors'

const PAGE_SIZE = 25

const SORT_FIELD_MAP: Record<string, string> = {
  fullName: 'full_name',
  city: 'city',
  photosCount: 'photos_count',
  friendsCount: 'friends_count',
  followersCount: 'followers_count',
  createdAt: 'created_at',
  lastSeenAt: 'last_seen_at',
  isVerified: 'is_verified',
}

type SortConfig = { key: string; dir: 'asc' | 'desc' }

const columns: Column[] = [
  { key: 'avatar', label: '', className: 'w-12', sortable: false },
  { key: 'fullName', label: 'Имя', sortable: true },
  { key: 'city', label: 'Город', className: 'w-28', sortable: true },
  { key: 'photosCount', label: 'Фото', className: 'w-20', sortable: true },
  { key: 'friendsCount', label: 'Друзья', className: 'w-20', sortable: true },
  { key: 'followersCount', label: 'Подписчики', className: 'w-24', sortable: true },
  { key: 'createdAt', label: 'Создан', className: 'w-24', sortable: true },
  { key: 'lastSeenAt', label: 'Активн.', className: 'w-24', sortable: true },
  { key: 'isVerified', label: 'Вериф.', className: 'w-20', sortable: true },
  { key: 'actions', label: 'Действия', sortable: false },
]

type Feedback = {
  type: 'success' | 'error'
  text: string
} | null

function exportToCsv(items: Author[]) {
  const header = 'ID;Имя;Screen Name;Город;Фото;Друзья;Подписчики;Верифицирован;Создан;Активность'
  const rows = items.map((a) =>
    [
      a.vkAuthorId,
      a.fullName,
      a.screenName || '',
      a.city?.title || '',
      a.photosCount ?? '',
      a.friendsCount ?? '',
      a.followersCount ?? '',
      a.isVerified ? 'Да' : 'Нет',
      a.createdAt ? new Date(a.createdAt).toLocaleDateString('ru-RU') : '',
      a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleDateString('ru-RU') : '',
    ].join(';'),
  )
  const bom = '\uFEFF'
  const blob = new Blob([bom + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `authors-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AuthorsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [cityFilter, setCityFilter] = useState('Все города')
  const [verifiedFilter, setVerifiedFilter] = useState('Все')
  const [sort, setSort] = useState<SortConfig>({ key: 'createdAt', dir: 'desc' })
  const [actionState, setActionState] = useState<ActionState>({
    verifying: null,
    deleting: null,
    confirmDelete: null,
  })
  const [feedback, setFeedback] = useState<Feedback>(null)
  const { selected, toggle, toggleAll, clear, count } = useSelection<number>()

  const debouncedSearch = useDebounce(search, 300)

  const queryKey = ['authors', { search: debouncedSearch, page, limit: pageSize, sortBy: SORT_FIELD_MAP[sort.key], sortOrder: sort.dir }]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchAuthors({
      search: debouncedSearch || undefined,
      page,
      limit: pageSize,
      type: 'user',
      sortBy: SORT_FIELD_MAP[sort.key] ?? undefined,
      sortOrder: sort.dir,
    }),
  })

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  const showFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
  }, [])

  const invalidateAuthors = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['authors'] })
  }, [queryClient])

  const verifyMutation = useMutation({
    mutationFn: verifyAuthor,
    onSuccess: () => {
      invalidateAuthors()
      setActionState((prev) => ({ ...prev, verifying: null }))
      showFeedback('success', 'Автор верифицирован')
    },
    onError: () => {
      setActionState((prev) => ({ ...prev, verifying: null }))
      showFeedback('error', 'Ошибка верификации')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAuthor,
    onSuccess: () => {
      invalidateAuthors()
      setActionState((prev) => ({ ...prev, deleting: null, confirmDelete: null }))
      clear()
      showFeedback('success', 'Автор удалён')
    },
    onError: () => {
      setActionState((prev) => ({ ...prev, deleting: null, confirmDelete: null }))
      showFeedback('error', 'Ошибка удаления')
    },
  })

  const runBatch = useCallback(async (ids: number[], fn: (id: number) => Promise<void>) => {
    for (const id of ids) await fn(id)
  }, [])

  const batchVerifyMutation = useMutation({
    mutationFn: (ids: number[]) => runBatch(ids, verifyAuthor),
    onSuccess: () => {
      invalidateAuthors()
      clear()
      showFeedback('success', 'Выбранные авторы верифицированы')
    },
    onError: () => {
      showFeedback('error', 'Ошибка пакетной верификации')
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => runBatch(ids, deleteAuthor),
    onSuccess: () => {
      invalidateAuthors()
      clear()
      showFeedback('success', 'Выбранные авторы удалены')
    },
    onError: () => {
      showFeedback('error', 'Ошибка пакетного удаления')
    },
  })

  const refreshMutation = useMutation({
    mutationFn: refreshAuthors,
    onSuccess: (updated) => {
      invalidateAuthors()
      showFeedback('success', `Обновлено ${updated} авторов`)
    },
    onError: () => {
      showFeedback('error', 'Ошибка обновления')
    },
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  const allIds = useMemo(() => data?.items.map((a) => a.vkAuthorId) ?? [], [data])

  const cityOptions = useMemo(() => {
    if (!data?.items) return ['Все города']
    const cities = new Set(data.items.map((a) => a.city?.title).filter((c): c is string => !!c))
    return ['Все города', ...Array.from(cities).sort()]
  }, [data])

  const verifiedOptions = ['Все', 'Да', 'Нет']

  const filtered = useMemo(() => {
    if (!data?.items) return []
    let items = data.items
    if (cityFilter !== 'Все города') items = items.filter((a) => a.city?.title === cityFilter)
    if (verifiedFilter !== 'Все') items = items.filter((a) => (verifiedFilter === 'Да') === a.isVerified)
    return items
  }, [data, cityFilter, verifiedFilter])

  const handleSort = useCallback((key: string) => {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setCityFilter('Все города')
    setVerifiedFilter('Все')
    setPage(1)
  }, [])

  const handleVerify = useCallback((id: number) => {
    setActionState((prev) => ({ ...prev, verifying: id }))
    verifyMutation.mutate(id)
  }, [])

  const handleDelete = useCallback((id: number) => {
    setActionState((prev) => ({ ...prev, deleting: id }))
    deleteMutation.mutate(id)
  }, [])

  const handleConfirmDelete = useCallback((id: number) => {
    setActionState((prev) => ({ ...prev, confirmDelete: id }))
  }, [])

  const handleCancelDelete = useCallback(() => {
    setActionState((prev) => ({ ...prev, confirmDelete: null }))
  }, [])

  const handleBatch = useCallback((fn: (ids: number[]) => void) => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    fn(ids)
  }, [selected])

  return (
    <PageShell title="Авторы">

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Поиск авторов..."
          aria-label="Поиск авторов"
        />
        <Select value={cityFilter} options={cityOptions} onChange={(v) => { setCityFilter(v); setPage(1) }} label="Фильтр по городу" />
        <Select value={verifiedFilter} options={verifiedOptions} onChange={(v) => { setVerifiedFilter(v); setPage(1) }} label="Фильтр по верификации" />
        <Button variant="secondary" size="xs" onClick={resetFilters} aria-label="Сбросить все фильтры" icon={<X size={12} />}>
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
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            icon={<RefreshCw size={14} />}
          >
            {refreshMutation.isPending ? 'Обновление...' : 'Обновить'}
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
            feedback.type === 'success'
              ? 'border-success bg-success-soft text-success'
              : 'border-danger bg-danger-soft text-danger'
          }`}
        >
          <Check size={12} />
          {feedback.text}
        </div>
      )}

      {count > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 text-xs" role="toolbar" aria-label="Действия с выбранными">
          <span className="text-text-muted mr-1">{count} выбрано:</span>
          <Button variant="soft" semantic="default" size="xs" onClick={() => handleBatch(batchVerifyMutation.mutate)} disabled={batchVerifyMutation.isPending} icon={<BadgeCheck size={12} />}>
            Верифицировать
          </Button>
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
        <TableShell>
          <TableHead columns={columns} sort={sort} onSort={handleSort} />
          <tbody>
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-sm text-danger">
                  <p>{error instanceof Error ? error.message : 'Произошла ошибка'}</p>
                  <Button variant="secondary" size="xs" onClick={() => refetch()}>
                    Повторить
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </TableShell>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            search || cityFilter !== 'Все города' || verifiedFilter !== 'Все'
              ? 'Ничего не найдено'
              : 'Нет авторов'
          }
          onReset={search || cityFilter !== 'Все города' || verifiedFilter !== 'Все' ? resetFilters : undefined}
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
              {filtered.map((author) => (
                <AuthorRow
                  key={author.vkAuthorId}
                  author={author}
                  checked={selected.has(author.vkAuthorId)}
                  actionState={actionState}
                  onVerify={handleVerify}
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
