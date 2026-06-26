import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SearchX, ArrowUpRight, MessageCircle, Bell, Plus, Pencil, Trash2 } from 'lucide-react'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { searchByKeywords, listGroups, createGroup, updateGroup, deleteGroup } from '../../shared/api/im'
import { PageShell } from '../../components/layout/PageShell'
import { MonitoringMessageDetail } from './components/MonitoringMessageDetail'
import { MonitoringGroupForm } from './components/MonitoringGroupForm'
import { Input, Button, Skeleton, ErrorState, ConfirmAction, FeedbackToast } from '../../components/ui'
import { EmptyState } from '../../components/widgets/table/EmptyState'
import { formatDateTime } from '../../shared/utils/time'
import type { ImMessage, ImGroup } from '../../types/im'

type Messenger = 'whatsapp' | 'max'

type Section = 'messages' | 'groups'
type EditingState = { type: 'create' } | { type: 'edit'; group: ImGroup } | null

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'messages', label: 'Сообщения' },
  { key: 'groups', label: 'Группы' },
]

const MESSENGERS: { key: Messenger; label: string; icon: React.ReactNode }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
  { key: 'max', label: 'Max', icon: <Bell size={16} /> },
]

const PAGE_SIZE = 25

export function MonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const section: Section = (searchParams.get('section') as Section) ?? 'messages'
  const messenger: Messenger = (searchParams.get('messenger') as Messenger) ?? 'whatsapp'
  const queryClient = useQueryClient()
  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [page, setPage] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState<ImMessage | null>(null)

  const [editing, setEditing] = useState<EditingState>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set(key, value); return n })
  }

  const messagesQuery = useQuery({
    queryKey: ['im-messages', messenger, debouncedSearch, page],
    queryFn: () =>
      searchByKeywords({
        messenger,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
    enabled: section === 'messages',
  })

  const groupsQuery = useQuery({
    queryKey: ['im-groups', messenger, debouncedSearch],
    queryFn: () => listGroups({ messenger, search: debouncedSearch || undefined }),
    enabled: section === 'groups',
  })

  const invalidateGroups = () => queryClient.invalidateQueries({ queryKey: ['im-groups'] })

  const createMutation = useMutation({
    mutationFn: (data: { messenger: string; chatId: string; name: string; category?: string | null }) =>
      createGroup(data),
    onSuccess: () => { invalidateGroups(); setEditing(null); showFeedback('success', 'Группа добавлена') },
    onError: (err) => showFeedback('error', `Ошибка: ${err instanceof Error ? err.message : String(err)}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name?: string | null; category?: string | null } }) =>
      updateGroup(id, payload),
    onSuccess: () => { invalidateGroups(); setEditing(null); showFeedback('success', 'Группа обновлена') },
    onError: (err) => showFeedback('error', `Ошибка: ${err instanceof Error ? err.message : String(err)}`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => { invalidateGroups(); setDeletingId(null); showFeedback('success', 'Группа удалена') },
    onError: (err) => showFeedback('error', `Ошибка: ${err instanceof Error ? err.message : String(err)}`),
  })

  const messages = useMemo(() => messagesQuery.data?.items ?? [], [messagesQuery.data])
  const hasMore = messagesQuery.data ? messagesQuery.data.page * messagesQuery.data.limit < messagesQuery.data.total : false
  const groups = useMemo(() => groupsQuery.data?.items ?? [], [groupsQuery.data])
  const isSaving = createMutation.isPending || updateMutation.isPending

  const handleSectionChange = (s: Section) => {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('section', s); return n })
    setSearch('')
    setPage(1)
    setSelectedMessage(null)
    setEditing(null)
  }

  const handleMessengerChange = (m: Messenger) => {
    setParam('messenger', m)
    setPage(1)
    setSearch('')
    setSelectedMessage(null)
  }

  const handleSelectMessage = (msg: ImMessage) => {
    setSelectedMessage((prev) => (prev?.id === msg.id ? null : msg))
  }

  const handleSaveGroup = useCallback((data: { name: string; chatId: string; messenger: string; category: string }) => {
    if (editing?.type === 'edit') {
      updateMutation.mutate({ id: editing.group.id, payload: { name: data.name, category: data.category } })
    } else {
      createMutation.mutate(data)
    }
  }, [editing, createMutation, updateMutation])

  const handleDeleteGroup = useCallback((id: number) => {
    deleteMutation.mutate(id)
  }, [deleteMutation])

  const sidebar = section === 'messages'
    ? <MonitoringMessageDetail message={selectedMessage} onClose={() => setSelectedMessage(null)} />
    : editing
      ? <MonitoringGroupForm group={editing.type === 'edit' ? editing.group : null} onSave={handleSaveGroup} onClose={() => setEditing(null)} isLoading={isSaving} />
      : null

  return (
    <PageShell title="Мониторинг" sidebar={sidebar}>
      <div className="mb-3 flex items-center gap-1 rounded-md border border-border bg-bg-panel p-0.5 w-fit">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => handleSectionChange(s.key)}
            className={`rounded px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              section === s.key
                ? 'bg-accent text-text-on-accent font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-1 rounded-md border border-border bg-bg-panel p-0.5 w-fit">
        {MESSENGERS.map((m) => (
          <button
            key={m.key}
            onClick={() => handleMessengerChange(m.key)}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              messenger === m.key
                ? 'bg-accent text-text-on-accent font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder={section === 'messages' ? 'Поиск по тексту сообщений...' : 'Поиск по названию или ID...'}
          aria-label="Поиск"
          className="max-w-xs"
        />
        {section === 'groups' && (
          <Button variant="primary" size="sm" onClick={() => setEditing({ type: 'create' })} icon={<Plus size={14} />}>
            Добавить группу
          </Button>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-1 flex-col min-w-0">
          {section === 'messages' ? (
            messagesQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : messagesQuery.isError ? (
              <div className="flex flex-1 items-center justify-center">
                <ErrorState error={messagesQuery.error} onRetry={() => messagesQuery.refetch()} />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={<SearchX size={32} className="text-text-muted" />}
                message={debouncedSearch ? 'Ничего не найдено по вашему запросу' : 'Нет сообщений для мониторинга'}
                action={debouncedSearch ? (
                  <Button variant="link" size="sm" semantic="default" onClick={() => { setSearch(''); setPage(1) }}>
                    Сбросить поиск
                  </Button>
                ) : undefined}
              />
            ) : (
              <>
                <div className="min-w-0 overflow-x-auto" role="region" aria-label="Сообщения мониторинга">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-bg-sidebar text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                        <th className="px-3 py-2 font-medium">Текст</th>
                        <th className="px-3 py-2 font-medium hidden sm:table-cell">Чат</th>
                        <th className="px-3 py-2 font-medium hidden sm:table-cell">Автор</th>
                        <th className="px-3 py-2 font-medium hidden md:table-cell">Дата</th>
                        <th className="px-3 py-2 font-medium w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((msg: ImMessage) => {
                        const isSelected = selectedMessage?.id === msg.id
                        return (
                          <tr key={msg.id} onClick={() => handleSelectMessage(msg)}
                            className={`border-b border-border transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-accent-soft' : 'hover:bg-bg-hover'}`}>
                            <td className="max-w-xs truncate px-3 py-2 text-text-primary">
                              {msg.text ?? <span className="text-text-muted italic">Нет текста</span>}
                            </td>
                            <td className="px-3 py-2 text-text-secondary truncate hidden sm:table-cell max-w-[120px]">
                              {msg.chat ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-text-secondary truncate hidden sm:table-cell max-w-[120px]">
                              {msg.author ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-text-secondary whitespace-nowrap hidden md:table-cell">
                              {formatDateTime(msg.createdAt)}
                            </td>
                            <td className="px-1 py-2">
                              {msg.contentUrl && (
                                <a href={msg.contentUrl} target="_blank" rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors duration-150"
                                  aria-label="Открыть в источнике">
                                  <ArrowUpRight size={14} />
                                </a>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {(hasMore || page > 1) && (
                  <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
                    <span role="status">
                      {messagesQuery.data && (
                        <>{(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, messagesQuery.data.total)} из {messagesQuery.data.total}</>
                      )}
                    </span>
                    <nav className="flex items-center gap-1" aria-label="Пагинация">
                      <Button variant="ghost" size="xs" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} aria-label="Предыдущая страница" semantic="default">Назад</Button>
                      {page > 1 && <button onClick={() => setPage(1)} className="flex min-w-[28px] items-center justify-center rounded text-xs text-text-secondary hover:bg-bg-hover transition-colors duration-150 py-1" aria-label="Первая страница">1</button>}
                      {page > 2 && <span className="text-xs text-text-muted px-1">&hellip;</span>}
                      <span className="flex min-w-[28px] items-center justify-center rounded text-xs bg-accent-soft text-accent font-medium py-1">{page}</span>
                      {hasMore && <button onClick={() => setPage((p) => p + 1)} className="flex min-w-[28px] items-center justify-center rounded text-xs text-text-secondary hover:bg-bg-hover transition-colors duration-150 py-1" aria-label="Следующая страница">{page + 1}</button>}
                      <Button variant="ghost" size="xs" onClick={() => setPage((p) => p + 1)} disabled={!hasMore} aria-label="Следующая страница" semantic="default">Вперёд</Button>
                    </nav>
                  </div>
                )}
              </>
            )
          ) : (
            groupsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : groupsQuery.isError ? (
              <div className="flex flex-1 items-center justify-center">
                <ErrorState error={groupsQuery.error} onRetry={() => groupsQuery.refetch()} />
              </div>
            ) : groups.length === 0 ? (
              <EmptyState
                icon={<SearchX size={32} className="text-text-muted" />}
                message={debouncedSearch ? 'Ничего не найдено по вашему запросу' : 'Нет отслеживаемых групп'}
                action={debouncedSearch ? (
                  <Button variant="link" size="sm" semantic="default" onClick={() => setSearch('')}>Сбросить поиск</Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setEditing({ type: 'create' })} icon={<Plus size={14} />}>Добавить первую группу</Button>
                )}
              />
            ) : (
              <div className="min-w-0 overflow-x-auto" role="region" aria-label="Группы мониторинга">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-sidebar text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      <th className="px-3 py-2 font-medium">Название</th>
                      <th className="px-3 py-2 font-medium hidden sm:table-cell">ID чата</th>
                      <th className="px-3 py-2 font-medium hidden sm:table-cell">Категория</th>
                      <th className="px-3 py-2 font-medium w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g: ImGroup) => {
                      const isDeleting = deletingId === g.id
                      return (
                        <tr key={g.id} className="border-b border-border transition-colors duration-150 hover:bg-bg-hover">
                          <td className="px-3 py-2 text-text-primary font-medium truncate max-w-[200px]">{g.name}</td>
                          <td className="px-3 py-2 text-text-secondary font-mono text-xs truncate hidden sm:table-cell max-w-[140px]">{g.chatId}</td>
                          <td className="px-3 py-2 text-text-secondary text-xs hidden sm:table-cell">
                            {g.category ?? <span className="text-text-muted italic">—</span>}
                          </td>
                          <td className="px-1 py-2">
                            {isDeleting ? (
                              <ConfirmAction onConfirm={() => handleDeleteGroup(g.id)} onCancel={() => setDeletingId(null)} isLoading={deleteMutation.isPending} message="Удалить?" />
                            ) : (
                              <div className="flex items-center gap-0.5">
                                <button onClick={() => setEditing({ type: 'edit', group: g })}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors duration-150" aria-label="Редактировать">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => setDeletingId(g.id)}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-colors duration-150" aria-label="Удалить">
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
            )
          )}
        </div>
      </div>

      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />
    </PageShell>
  )
}
