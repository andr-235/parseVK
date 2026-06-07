import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, RefreshCw, Settings2, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { TableShell } from '../../components/widgets/table/TableShell'
import { TableHead } from '../../components/widgets/table/TableHead'
import { TableSkeleton } from '../../components/widgets/table/TableSkeleton'
import { EmptyState } from '../../components/widgets/table/EmptyState'
import { PaginationBar } from '../../components/widgets/table/PaginationBar'
import { FeedbackToast } from '../../components/widgets/table/FeedbackToast'
import { TableError } from '../../components/widgets/table/TableError'
import type { Column } from '../../components/widgets/table/constants'
import type { TaskStatus } from '../../shared/api/tasks'
import { errorMessage, formatError } from '../../shared/utils/error'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { useTableKeyboardNavigation } from '../../shared/hooks/useTableKeyboardNavigation'
import { TaskRow } from './components/TaskRow'
import { CreateTaskForm } from './components/CreateTaskForm'
import { AutomationPanel } from './components/AutomationPanel'
import {
  fetchTasks,
  createTask,
  resumeTask,
  checkTask,
  cancelTask,
  deleteTask,
  batchDeleteTasks,
  getAutomationSettings,
  updateAutomationSettings,
  runAutomation,
  type AutomationSettingsUpdate,
} from '../../shared/api/tasks'

const PAGE_SIZE = 25

function pluralTasks(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'задачу'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'задачи'
  return 'задач'
}

const STATUS_OPTIONS: TaskStatus[] = ['pending', 'running', 'done', 'failed', 'cancelled']

const STATUS_FILTER_LABELS: Record<TaskStatus, string> = {
  pending: 'В ожидании',
  running: 'Выполняется',
  done: 'Готово',
  failed: 'Ошибка',
  cancelled: 'Отменена',
}

const columns: Column[] = [
  { key: 'id', label: 'ID', className: 'w-16', sortable: false },
  { key: 'status', label: 'Статус', className: 'w-24', sortable: false },
  { key: 'mode', label: 'Режим', className: 'w-28', sortable: false },
  { key: 'progress', label: 'Прогресс', className: 'w-36', sortable: false },
  { key: 'postLimit', label: 'Посты', className: 'w-16', sortable: false },
  { key: 'createdAt', label: 'Создана', className: 'w-32', sortable: false },
  { key: 'actions', label: 'Действия', className: 'w-44', sortable: false },
]

export function TasksPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [showForm, setShowForm] = useState(false)
  const [showAutomation, setShowAutomation] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const queryKey = ['tasks', { page, limit: pageSize }]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchTasks(page, pageSize),
    refetchInterval: (query) => {
      const tasks = query.state.data?.tasks
      if (!tasks) return false
      const hasActive = tasks.some((t) => t.status === 'pending' || t.status === 'running')
      return hasActive ? 5000 : false
    },
  })

  const rawTasks = data?.tasks ?? []
  const hasActive = rawTasks.some((t) => t.status === 'pending' || t.status === 'running')

  const tasks = useMemo(
    () => statusFilter ? rawTasks.filter((t) => t.status === statusFilter) : rawTasks,
    [rawTasks, statusFilter],
  )

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0
  const allSelected = tasks.length > 0 && selected.size === tasks.length

  const { feedback, showFeedback, dismissFeedback } = useFeedback()
  const { focusedRow } = useTableKeyboardNavigation(tasks.length)

  const autoQuery = useQuery({
    queryKey: ['automation-settings'],
    queryFn: getAutomationSettings,
    enabled: showAutomation,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [queryClient])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!tasks.length) return
      if (e.key === 'Delete' && focusedRow >= 0) {
        const task = tasks[focusedRow]
        if (task && confirmDeleteId !== task.id) {
          e.preventDefault()
          setConfirmDeleteId(task.id)
        }
      } else if (e.key === 'Escape') {
        setConfirmDeleteId(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tasks, focusedRow, confirmDeleteId])

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setShowForm(false)
      invalidate()
      showFeedback('success', 'Задача создана')
    },
    onError: (err) => {
      showFeedback('error', errorMessage(err, 'Ошибка создания задачи'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      setConfirmDeleteId(null)
      invalidate()
      showFeedback('success', 'Задача удалена')
    },
    onError: (err) => {
      setConfirmDeleteId(null)
      showFeedback('error', errorMessage(err, 'Ошибка удаления'))
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: batchDeleteTasks,
    onSuccess: () => {
      setSelected(new Set())
      invalidate()
      showFeedback('success', 'Выбранные задачи удалены')
    },
    onError: (err) => {
      showFeedback('error', errorMessage(err, 'Ошибка массового удаления'))
    },
  })

  const resumeMutation = useMutation({
    mutationFn: resumeTask,
    onMutate: (id) => { setActingId(id) },
    onSettled: () => { setActingId(null); invalidate() },
    onError: (err) => {
      showFeedback('error', errorMessage(err, 'Ошибка повтора задачи'))
    },
    onSuccess: () => {
      showFeedback('success', 'Задача возобновлена')
    },
  })

  const checkMutation = useMutation({
    mutationFn: checkTask,
    onMutate: (id) => { setActingId(id) },
    onSettled: () => { setActingId(null); invalidate() },
    onError: (err) => {
      showFeedback('error', errorMessage(err, 'Ошибка проверки статуса'))
    },
    onSuccess: () => {
      showFeedback('success', 'Статус задачи обновлён')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelTask,
    onMutate: (id) => { setActingId(id) },
    onSettled: () => { setActingId(null); invalidate() },
    onError: (err) => {
      showFeedback('error', errorMessage(err, 'Ошибка остановки задачи'))
    },
    onSuccess: () => {
      showFeedback('success', 'Задача остановлена')
    },
  })

  const saveAutoMutation = useMutation({
    mutationFn: (s: AutomationSettingsUpdate) => updateAutomationSettings(s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] })
      showFeedback('success', 'Настройки автоматизации сохранены')
    },
    onError: (err) => {
      showFeedback('error', errorMessage(err, 'Ошибка сохранения настроек'))
    },
  })

  const runAutoMutation = useMutation({
    mutationFn: runAutomation,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] })
      invalidate()
      if (res.started) {
        showFeedback('success', 'Автоматический сбор запущен')
      } else {
        showFeedback('error', res.reason || 'Не удалось запустить автоматический сбор')
      }
    },
    onError: (err) => {
      showFeedback('error', errorMessage(err, 'Ошибка запуска автоматизации'))
    },
  })

  const handleResume = useCallback((id: number) => resumeMutation.mutate(id), [resumeMutation])
  const handleCheck = useCallback((id: number) => checkMutation.mutate(id), [checkMutation])
  const handleCancel = useCallback((id: number) => cancelMutation.mutate(id), [cancelMutation])
  const handleDelete = useCallback((id: number) => deleteMutation.mutate(id), [deleteMutation])
  const handleCancelDelete = useCallback(() => setConfirmDeleteId(null), [])
  const handleToggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])
  const handleToggleAll = useCallback(() => {
    setSelected((prev) => prev.size === tasks.length ? new Set() : new Set(tasks.map((t) => t.id)))
  }, [tasks])

  return (
    <PageShell title="Задачи парсинга">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary" size="xs"
          onClick={() => setShowForm((v) => !v)}
          icon={showForm ? <X size={14} /> : <Plus size={14} />}
        >
          {showForm ? 'Отмена' : 'Новая задача'}
        </Button>
        <Button
          variant="secondary" size="xs"
          onClick={() => setShowAutomation((v) => !v)}
          icon={<Settings2 size={14} />}
        >
          {showAutomation ? 'Скрыть' : 'Автоматизация'}
        </Button>
        <div className="ml-auto">
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

      {showForm && (
        <CreateTaskForm
          onSubmit={(params) => createMutation.mutate(params)}
          onCancel={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {showAutomation && (
        <AutomationPanel
          settings={autoQuery.data}
          isLoading={autoQuery.isLoading}
          onSave={(s) => saveAutoMutation.mutate(s)}
          onRun={() => runAutoMutation.mutate()}
          isSaving={saveAutoMutation.isPending}
          isRunning={runAutoMutation.isPending}
        />
      )}

      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />

      {data && !isLoading && !isError && rawTasks.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-text-muted">Всего задач: {data.total.toLocaleString('ru-RU')}</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => { setStatusFilter(null); setSelected(new Set()) }}
                className={`rounded px-2 py-0.5 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  statusFilter === null ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Все
              </button>
              {STATUS_OPTIONS.map((s) => {
                const count = rawTasks.filter((t) => t.status === s).length
                if (count === 0) return null
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setStatusFilter(s); setSelected(new Set()) }}
                    className={`rounded px-2 py-0.5 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      statusFilter === s ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {STATUS_FILTER_LABELS[s]} ({count})
                  </button>
                )
              })}
            </div>
          </div>
          {selected.size > 0 && (
            <Button
              variant="ghost" size="xs" semantic="danger"
              onClick={() => batchDeleteMutation.mutate(Array.from(selected))}
              disabled={batchDeleteMutation.isPending}
              icon={<Trash2 size={13} />}
            >
              Удалить {selected.size} {pluralTasks(selected.size)}
            </Button>
          )}
          {hasActive && (
            <span className="text-xs text-text-muted ml-auto">Обновление каждые 5 сек</span>
          )}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <TableError
          columns={columns}
          message={formatError(error)}
          onRetry={() => refetch()}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          message={statusFilter ? `Нет задач со статусом «${STATUS_FILTER_LABELS[statusFilter]}».` : 'Нет задач. Создайте новую задачу парсинга.'}
        />
      ) : (
        <>
          <TableShell>
            <TableHead
              columns={columns}
              allChecked={allSelected}
              onToggleAll={handleToggleAll}
            />
            <tbody>
              {tasks.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isFocused={focusedRow === index}
                  onResume={handleResume}
                  onCheck={handleCheck}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onConfirmDelete={setConfirmDeleteId}
                  onCancelDelete={handleCancelDelete}
                  confirmDeleteId={confirmDeleteId}
                  isDeleting={deleteMutation.isPending}
                  actingId={actingId}
                  selected={selected.has(task.id)}
                  onToggleSelect={handleToggleSelect}
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
              onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
          )}
        </>
      )}
    </PageShell>
  )
}