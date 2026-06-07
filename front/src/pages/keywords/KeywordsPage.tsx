import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Upload, RefreshCw, RotateCcw, X, Trash2, ChevronUp,
} from 'lucide-react'
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
import { KeywordRow } from './components/KeywordRow'
import type { ActionState } from './components/KeywordRow'
import {
  fetchKeywords,
  addKeyword,
  bulkAddKeywords,
  uploadKeywords,
  deleteKeyword,
  recalculateMatches,
  rebuildForms,
  type Keyword,
} from '../../shared/api/keywords'

const PAGE_SIZE = 50

const columns: Column[] = [
  { key: 'checkbox', label: '', className: 'w-10', sortable: false },
  { key: 'expand', label: '', className: 'w-8', sortable: false },
  { key: 'word', label: 'Слово', sortable: false },
  { key: 'category', label: 'Категория', className: 'w-36', sortable: false },
  { key: 'isPhrase', label: 'Тип', className: 'w-20', sortable: false },
  { key: 'createdAt', label: 'Создано', className: 'w-24', sortable: false },
  { key: 'actions', label: '', className: 'w-20', sortable: false },
]

export function KeywordsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [actionState, setActionState] = useState<ActionState>({
    deleting: null,
    confirmDelete: null,
  })
  const [undoData, setUndoData] = useState<{ keyword: Keyword } | null>(null)
  const undoRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [addMode, setAddMode] = useState<'single' | 'bulk' | 'upload'>('single')
  const [singleWord, setSingleWord] = useState('')
  const [singleCategory, setSingleCategory] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const { selected, toggle, toggleAll, clear, count } = useSelection<number>()

  const debouncedSearch = useDebounce(search, 300)

  const queryKey = ['keywords', { search: debouncedSearch, page, limit: pageSize }]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchKeywords({ search: debouncedSearch || undefined, page, limit: pageSize }),
  })

  const keywords = data?.keywords ?? []

  const { feedback, showFeedback, dismissFeedback } = useFeedback()
  const { focusedRow } = useTableKeyboardNavigation(keywords.length)

  const invalidateKeywords = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['keywords'] })
  }, [queryClient])

  const deleteMutation = useMutation({
    mutationFn: deleteKeyword,
    onSuccess: () => {
      invalidateKeywords()
      setActionState((prev) => ({ ...prev, deleting: null, confirmDelete: null }))
      clear()
      showFeedback('success', 'Ключевое слово удалено')
      setUndoData(null)
    },
    onError: (err) => {
      setActionState((prev) => ({ ...prev, deleting: null, confirmDelete: null }))
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка удаления')
      setUndoData(null)
    },
  })

  const addMutation = useMutation({
    mutationFn: () => addKeyword(singleWord.trim(), singleCategory || undefined),
    onSuccess: () => {
      setSingleWord('')
      setSingleCategory('')
      invalidateKeywords()
      showFeedback('success', 'Ключевое слово добавлено')
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка добавления')
    },
  })

  const bulkAddMutation = useMutation({
    mutationFn: () => {
      const words = bulkText.split('\n').map((w) => w.trim()).filter(Boolean)
      return bulkAddKeywords(words)
    },
    onSuccess: (result) => {
      setBulkText('')
      invalidateKeywords()
      showFeedback('success', `Добавлено: ${result.createdCount}, обновлено: ${result.updatedCount}, ошибок: ${result.failedCount}`)
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка массового добавления')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: () => uploadKeywords(uploadFile!),
    onSuccess: () => {
      setUploadFile(null)
      invalidateKeywords()
      showFeedback('success', 'Файл загружен')
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка загрузки файла')
    },
  })

  const recalcMutation = useMutation({
    mutationFn: recalculateMatches,
    onSuccess: () => {
      showFeedback('success', 'Пересчёт запущен')
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка пересчёта')
    },
  })

  const rebuildMutation = useMutation({
    mutationFn: rebuildForms,
    onSuccess: () => {
      invalidateKeywords()
      showFeedback('success', 'Формы перестроены')
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка перестроения форм')
    },
  })

  const runBatch = useCallback(async (ids: number[], fn: (id: number) => Promise<void>) => {
    for (const id of ids) await fn(id)
  }, [])

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => runBatch(ids, deleteKeyword),
    onSuccess: () => {
      invalidateKeywords()
      clear()
      showFeedback('success', 'Выбранные ключевые слова удалены')
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка пакетного удаления')
    },
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0
  const allIds = useMemo(() => data?.keywords.map((k) => k.id) ?? [], [data])

  const resetFilters = useCallback(() => {
    setSearch('')
    setPage(1)
  }, [])

  const handleDelete = useCallback((id: number) => {
    const kw = keywords.find((k) => k.id === id)
    if (!kw) return
    setActionState((prev) => ({ ...prev, deleting: id }))
    setUndoData({ keyword: kw })
    undoRef.current = setTimeout(() => {
      deleteMutation.mutate(id)
    }, 5000)
  }, [keywords, deleteMutation])

  const handleConfirmDelete = useCallback((id: number) => {
    setActionState((prev) => ({ ...prev, confirmDelete: id }))
  }, [])

  const handleCancelDelete = useCallback(() => {
    setActionState((prev) => ({ ...prev, confirmDelete: null }))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!keywords.length) return
      if (e.key === 'Delete' && focusedRow >= 0) {
        const kw = keywords[focusedRow]
        if (kw && actionState.confirmDelete !== kw.id) {
          e.preventDefault()
          handleConfirmDelete(kw.id)
        }
      } else if (e.key === 'Escape') {
        handleCancelDelete()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [keywords, focusedRow, actionState.confirmDelete, handleConfirmDelete, handleCancelDelete])

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

  const toggleAddPanel = () => {
    setAddPanelOpen((v) => !v)
    setAddMode('single')
    setSingleWord('')
    setSingleCategory('')
    setBulkText('')
    setUploadFile(null)
  }

  return (
    <PageShell title="Ключевые слова">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
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
            placeholder="Поиск слов..."
            className="pl-8"
            aria-label="Поиск ключевых слов"
          />
        </div>
        {search && (
          <Button variant="secondary" size="xs" onClick={resetFilters} aria-label="Сбросить поиск" icon={<X size={12} />}>
            Сбросить
          </Button>
        )}
        <Button
          variant={addPanelOpen ? 'primary' : 'secondary'}
          size="xs"
          onClick={toggleAddPanel}
          icon={addPanelOpen ? <ChevronUp size={14} /> : <Plus size={14} />}
        >
          {addPanelOpen ? 'Скрыть' : 'Добавить'}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary" size="xs"
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending}
            icon={<RefreshCw size={14} />}
          >
            Пересчёт
          </Button>
          <Button
            variant="secondary" size="xs"
            onClick={() => rebuildMutation.mutate()}
            disabled={rebuildMutation.isPending}
            icon={<RotateCcw size={14} />}
          >
            Формы
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

      {addPanelOpen && (
        <div className="mb-4 rounded-md border border-border bg-bg-panel p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-2" role="tablist" aria-label="Способ добавления">
            <button
              type="button"
              role="tab"
              aria-selected={addMode === 'single'}
              onClick={() => setAddMode('single')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                addMode === 'single'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              Одно слово
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={addMode === 'bulk'}
              onClick={() => setAddMode('bulk')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                addMode === 'bulk'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              Список
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={addMode === 'upload'}
              onClick={() => setAddMode('upload')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                addMode === 'upload'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              Файл
            </button>
          </div>

          {addMode === 'single' && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-text-muted" htmlFor="kw-word">Слово</label>
                <Input
                  id="kw-word"
                  type="text"
                  value={singleWord}
                  onChange={(e) => setSingleWord(e.target.value)}
                  placeholder="Введите ключевое слово..."
                  className="h-8"
                />
              </div>
              <div className="w-40">
                <label className="mb-1 block text-xs text-text-muted" htmlFor="kw-category">Категория</label>
                <Input
                  id="kw-category"
                  type="text"
                  value={singleCategory}
                  onChange={(e) => setSingleCategory(e.target.value)}
                  placeholder="необязательно"
                  className="h-8"
                />
              </div>
              <Button
                variant="primary" size="md"
                onClick={() => addMutation.mutate()}
                disabled={!singleWord.trim() || addMutation.isPending}
              >
                {addMutation.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          )}

          {addMode === 'bulk' && (
            <div>
              <label className="mb-1 block text-xs text-text-muted" htmlFor="kw-bulk">
                Слова через Enter (каждая строка — отдельное слово)
              </label>
              <textarea
                id="kw-bulk"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"слово1\nслово2\nслово3"}
                className="mb-2 h-24 w-full resize-y rounded-md border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors duration-150 focus:border-accent"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="primary" size="md"
                  onClick={() => bulkAddMutation.mutate()}
                  disabled={!bulkText.trim() || bulkAddMutation.isPending}
                >
                  {bulkAddMutation.isPending ? 'Добавление...' : `Добавить (${bulkText.split('\n').filter(Boolean).length} слов)`}
                </Button>
                {bulkText && (
                  <span className="text-xs text-text-muted">
                    Будет добавлено/обновлено ~{bulkText.split('\n').filter(Boolean).length} слов
                  </span>
                )}
              </div>
            </div>
          )}

          {addMode === 'upload' && (
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-surface px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors duration-150">
                <Upload size={14} />
                {uploadFile ? uploadFile.name : 'Выбрать файл (.txt, .csv)'}
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              <Button
                variant="primary" size="md"
                onClick={() => uploadMutation.mutate()}
                disabled={!uploadFile || uploadMutation.isPending}
                icon={<Upload size={14} />}
              >
                {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
              </Button>
              {uploadFile && (
                <Button variant="ghost" size="xs" semantic="default" onClick={() => setUploadFile(null)} icon={<X size={12} />}>
                  Отмена
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />

      {undoData && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 text-xs" role="status">
          <span className="text-text-secondary">{undoData.keyword.word} будет удалено через 5с</span>
          <Button variant="soft" size="xs" semantic="default" onClick={handleUndo} icon={<X size={12} />}>
            Отменить
          </Button>
        </div>
      )}

      {data && !isLoading && !isError && keywords.length > 0 && (
        <p className="mb-3 text-xs text-text-muted">Всего: {data.total.toLocaleString('ru-RU')}</p>
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
      ) : keywords.length === 0 ? (
        <EmptyState
          message={
            search
              ? 'Ничего не найдено'
              : 'Нет ключевых слов. Добавьте слова через панель сверху или загрузите файл.'
          }
          onReset={search ? resetFilters : undefined}
        />
      ) : (
        <>
          <TableShell>
            <TableHead
              columns={columns}
              sort={undefined}
              onSort={() => {}}
              allChecked={count === keywords.length && keywords.length > 0}
              onToggleAll={() => toggleAll(allIds)}
            />
            <tbody>
              {keywords.map((kw, index) => (
                <KeywordRow
                  key={kw.id}
                  keyword={kw}
                  checked={selected.has(kw.id)}
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
