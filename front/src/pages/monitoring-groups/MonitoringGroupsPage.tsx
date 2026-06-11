import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SearchX, RefreshCw, Plus, Pencil, Trash2, MessageCircle, Bell } from 'lucide-react'
import { PageShell } from '../../components/layout/PageShell'
import { MonitoringGroupForm } from './components/MonitoringGroupForm'
import { Input, Button, Skeleton, ErrorState, ConfirmAction, FeedbackToast } from '../../components/ui'
import { EmptyState } from '../../components/widgets/table/EmptyState'
import { useFeedback } from '../../shared/hooks/useFeedback'
import {
  fetchMonitoringGroups,
  createMonitoringGroup,
  updateMonitoringGroup,
  deleteMonitoringGroup,
} from '../../shared/api/monitoring'
import type { MonitoringGroup, Messenger } from '../../types/monitoring'

const TABS: { key: Messenger | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'max', label: 'Max' },
]

const messengerIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle size={14} />,
  max: <Bell size={14} />,
}

type EditingState = { type: 'create' } | { type: 'edit'; group: MonitoringGroup } | null

export function MonitoringGroupsPage() {
  const [messengerFilter, setMessengerFilter] = useState<Messenger | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<EditingState>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  const messenger = messengerFilter === 'all' ? undefined : messengerFilter
  const isSyncingAll = messengerFilter === 'all'

  const query = useQuery({
    queryKey: ['monitoring-groups', messenger, search],
    queryFn: () => fetchMonitoringGroups({ messenger, search: search || undefined }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['monitoring-groups'] })

  const createMutation = useMutation({
    mutationFn: createMonitoringGroup,
    onSuccess: () => { invalidate(); setEditing(null); showFeedback('success', 'Группа добавлена') },
    onError: (err) => showFeedback('error', `Ошибка: ${err instanceof Error ? err.message : String(err)}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateMonitoringGroup>[1] }) =>
      updateMonitoringGroup(id, payload),
    onSuccess: () => { invalidate(); setEditing(null); showFeedback('success', 'Группа обновлена') },
    onError: (err) => showFeedback('error', `Ошибка: ${err instanceof Error ? err.message : String(err)}`),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMonitoringGroup,
    onSuccess: () => { invalidate(); setDeletingId(null); showFeedback('success', 'Группа удалена') },
    onError: (err) => showFeedback('error', `Ошибка: ${err instanceof Error ? err.message : String(err)}`),
  })

  const syncMutation = useMutation({
    mutationFn: (m: Messenger) => fetchMonitoringGroups({ messenger: m, sync: true }),
    onSuccess: () => { invalidate(); showFeedback('success', 'Синхронизация завершена') },
    onError: (err) => showFeedback('error', `Ошибка синхронизации: ${err instanceof Error ? err.message : String(err)}`),
  })

  const handleSave = useCallback((data: { name: string; chatId: string; messenger: Messenger; category: string }) => {
    if (editing?.type === 'edit') {
      updateMutation.mutate({ id: editing.group.id, payload: data })
    } else {
      createMutation.mutate(data)
    }
  }, [editing, createMutation, updateMutation])

  const handleDelete = useCallback((id: number) => {
    deleteMutation.mutate(id)
  }, [deleteMutation])

  const handleSync = useCallback(() => {
    if (!isSyncingAll) {
      syncMutation.mutate(messengerFilter as Messenger)
    }
  }, [isSyncingAll, messengerFilter, syncMutation])

  const groups = query.data?.items ?? []
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <PageShell
      title="Группы мониторинга"
      sidebar={
        editing && (
          <MonitoringGroupForm
            group={editing.type === 'edit' ? editing.group : null}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            isLoading={isSaving}
          />
        )
      }
    >
      <div className="mb-4 flex items-center gap-1 rounded-md border border-border bg-bg-panel p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setMessengerFilter(t.key); setSearch('') }}
            className={`rounded px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              messengerFilter === t.key
                ? 'bg-accent text-text-on-accent font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или ID..."
          aria-label="Поиск групп"
          className="max-w-xs"
        />
        <Button variant="primary" size="sm" onClick={() => setEditing({ type: 'create' })} icon={<Plus size={14} />}>
          Добавить группу
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSync}
          disabled={isSyncingAll || syncMutation.isPending}
          icon={<RefreshCw size={14} className={syncMutation.isPending ? 'animate-spin' : ''} />}
        >
          {syncMutation.isPending ? 'Синхронизация...' : 'Синхронизировать'}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-1 flex-col min-w-0">
          {query.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="flex flex-1 items-center justify-center">
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={<SearchX size={32} className="text-text-muted" />}
              message={search ? 'Ничего не найдено по вашему запросу' : 'Нет отслеживаемых групп'}
              action={
                search ? (
                  <Button variant="link" size="sm" semantic="default" onClick={() => setSearch('')}>
                    Сбросить поиск
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setEditing({ type: 'create' })} icon={<Plus size={14} />}>
                    Добавить первую группу
                  </Button>
                )
              }
            />
          ) : (
            <div className="min-w-0 overflow-x-auto" role="region" aria-label="Группы мониторинга">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-sidebar text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    <th className="px-3 py-2 font-medium">Название</th>
                    <th className="px-3 py-2 font-medium hidden sm:table-cell">ID чата</th>
                    <th className="px-3 py-2 font-medium hidden sm:table-cell">Мессенджер</th>
                    <th className="px-3 py-2 font-medium hidden md:table-cell">Категория</th>
                    <th className="px-3 py-2 font-medium w-24" />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const isDeleting = deletingId === g.id
                    return (
                      <tr key={g.id} className="border-b border-border transition-colors duration-150 hover:bg-bg-hover">
                        <td className="px-3 py-2 text-text-primary font-medium truncate max-w-[200px]">
                          {g.name}
                        </td>
                        <td className="px-3 py-2 text-text-secondary font-mono text-xs truncate hidden sm:table-cell max-w-[140px]">
                          {g.chatId}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 rounded-sm bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                            {messengerIcons[g.messenger]}
                            {g.messenger === 'whatsapp' ? 'WhatsApp' : 'Max'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-xs hidden md:table-cell">
                          {g.category ?? (
                            <span className="text-text-muted italic">—</span>
                          )}
                        </td>
                        <td className="px-1 py-2">
                          {isDeleting ? (
                            <ConfirmAction
                              onConfirm={() => handleDelete(g.id)}
                              onCancel={() => setDeletingId(null)}
                              isLoading={deleteMutation.isPending}
                              message="Удалить?"
                            />
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => setEditing({ type: 'edit', group: g })}
                                className="inline-flex items-center justify-center w-7 h-7 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors duration-150"
                                aria-label="Редактировать"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingId(g.id)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-colors duration-150"
                                aria-label="Удалить"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />
    </PageShell>
  )
}
