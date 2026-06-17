import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  Play,
  Square,
  Trash2,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  MessageSquare,
  User,
  Settings
} from 'lucide-react'
import { Button, ConfirmAction, ErrorState, FeedbackToast } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { useFeedback } from '../../shared/hooks/useFeedback'
import {
  fetchWatchlistAuthors,
  createWatchlistAuthor,
  fetchWatchlistAuthorDetails,
  updateWatchlistAuthor,
  deleteWatchlistAuthor,
  fetchWatchlistSettings,
  updateWatchlistSettings,
  refreshWatchlist
} from '../../shared/api/watchlist'
import { SettingsPanel } from './components/SettingsPanel'
import { AddAuthorForm } from './components/AddAuthorForm'
import { AuthorItem } from './components/AuthorItem'
import { CommentItem } from './components/CommentItem'
import { AuthorListSkeleton, AuthorDetailsSkeleton } from './components/Skeletons'

export function WatchlistPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { feedback, showFeedback, dismissFeedback } = useFeedback()
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Автоматический выбор автора по query параметру selected
  useEffect(() => {
    const selectedParam = searchParams.get('selected')
    if (selectedParam) {
      const id = parseInt(selectedParam, 10)
      if (!isNaN(id)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedAuthorId(id)
      }
    }
  }, [searchParams])

  // Состояния для формы настроек
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [formTrackAllComments, setFormTrackAllComments] = useState(false)
  const [formPollInterval, setFormPollInterval] = useState(5)
  const [formMaxAuthors, setFormMaxAuthors] = useState(50)
  
  // Состояния для добавления автора
  const [showAddForm, setShowAddForm] = useState(false)
  const [addVkId, setAddVkId] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  // Состояние подтверждения удаления
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Запросы данных
  const { data: authorsData, isLoading: loadingAuthors, isError: hasAuthorsError, error: authorsError, refetch: retryFetchAuthors } = useQuery({
    queryKey: ['watchlist-authors'],
    queryFn: () => fetchWatchlistAuthors({ limit: 100 }),
  })

  const { data: settingsData } = useQuery({
    queryKey: ['watchlist-settings'],
    queryFn: fetchWatchlistSettings,
  })

  const { data: authorDetails, isLoading: loadingDetails, isError: hasDetailsError, error: detailsError, refetch: retryFetchDetails } = useQuery({
    queryKey: ['watchlist-author-details', selectedAuthorId],
    queryFn: () => selectedAuthorId ? fetchWatchlistAuthorDetails(selectedAuthorId, { limit: 100 }) : null,
    enabled: !!selectedAuthorId,
  })

  // Синхронизация формы настроек с бэкендом
  useEffect(() => {
    if (settingsData) {

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormPollInterval(settingsData.pollIntervalMinutes)
    }
  }, [settingsData])

  // Мутации
  const refreshMutation = useMutation({
    mutationFn: refreshWatchlist,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-authors'] })
      if (selectedAuthorId) {
        queryClient.invalidateQueries({ queryKey: ['watchlist-author-details', selectedAuthorId] })
      }
      showFeedback('success', `Обновление успешно завершено. Найдено новых комментариев: ${res.new_comments}`)
    },
    onError: (err) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      showFeedback('error', `Ошибка принудительного обновления: ${errMsg}`)
    }
  })

  const saveSettingsMutation = useMutation({
    mutationFn: updateWatchlistSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-settings'] })
      setSettingsExpanded(false)
      showFeedback('success', 'Настройки успешно сохранены')
    },
    onError: (err) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      showFeedback('error', `Ошибка сохранения настроек: ${errMsg}`)
    }
  })

  const createAuthorMutation = useMutation({
    mutationFn: createWatchlistAuthor,
    onSuccess: (newAuthor) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-authors'] })
      setAddVkId('')
      setShowAddForm(false)
      setAddError(null)
      setSelectedAuthorId(newAuthor.id)
    },
    onError: (err) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      let msg = errMsg
      if (msg.includes('409') || msg.includes('already')) {
        msg = 'Этот автор уже добавлен в список'
      }
      setAddError(msg)
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'STOPPED' }) => 
      updateWatchlistAuthor(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-authors'] })
      if (selectedAuthorId === variables.id) {
        queryClient.invalidateQueries({ queryKey: ['watchlist-author-details', selectedAuthorId] })
      }
      showFeedback('success', 'Статус мониторинга изменен')
    },
    onError: (err) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      showFeedback('error', `Ошибка изменения статуса мониторинга: ${errMsg}`)
    }
  })

  const deleteAuthorMutation = useMutation({
    mutationFn: deleteWatchlistAuthor,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-authors'] })
      if (selectedAuthorId === id) {
        setSelectedAuthorId(null)
      }
      setConfirmDeleteId(null)
      showFeedback('success', 'Автор удален из списка')
    },
    onError: (err) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      showFeedback('error', `Ошибка удаления автора: ${errMsg}`)
      setConfirmDeleteId(null)
    }
  })

  // Фильтрация списка авторов по поиску
  const filteredAuthors = useMemo(() => {
    if (!authorsData?.items) return []
    const query = searchQuery.trim().toLowerCase()
    if (!query) return authorsData.items
    return authorsData.items.filter((author) => {
      const vkIdStr = String(author.authorVkId)
      const fullName = author.author?.fullName?.toLowerCase() || ''
      const screenName = author.author?.screenName?.toLowerCase() || ''
      return vkIdStr.includes(query) || fullName.includes(query) || screenName.includes(query)
    })
  }, [authorsData, searchQuery])

  // Сохранение настроек
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      trackAllComments: formTrackAllComments,
      pollIntervalMinutes: formPollInterval,
      maxAuthors: formMaxAuthors,
    })
  }

  // Добавление автора
  const handleAddAuthor = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    const parsedId = parseInt(addVkId.trim(), 10)
    if (isNaN(parsedId) || parsedId <= 0) {
      setAddError('Введите корректный числовой VK ID')
      return
    }
    createAuthorMutation.mutate({ authorVkId: parsedId })
  }

  return (
    <PageShell title="На карандаше">
      {/* Шапка с описанием и настройками */}
      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Button
              variant="secondary"
              semantic="default"
              size="sm"
              icon={<Settings size={14} />}
              onClick={() => setSettingsExpanded(!settingsExpanded)}
            >
              Настройки
            </Button>
            <Button
              variant="primary"
              semantic="default"
              size="sm"
              icon={<RefreshCw size={14} className={refreshMutation.isPending ? 'animate-spin' : ''} />}
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? 'Обновление...' : 'Обновить сейчас'}
            </Button>
          </div>
        </div>

        {/* Раскрывающаяся панель настроек */}
        <SettingsPanel
          expanded={settingsExpanded}
          onClose={() => setSettingsExpanded(false)}
          onSave={handleSaveSettings}
          trackAllComments={formTrackAllComments}
          setTrackAllComments={setFormTrackAllComments}
          pollInterval={formPollInterval}
          setPollInterval={setFormPollInterval}
          maxAuthors={formMaxAuthors}
          setMaxAuthors={setFormMaxAuthors}
          isSaving={saveSettingsMutation.isPending}
        />
      </div>

      {/* Двухколоночный Evidence Board */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0 items-stretch h-auto lg:h-[calc(100vh-200px)]">
        
        {/* Левая колонка: Список авторов */}
        <div className="w-full lg:w-80 h-[350px] lg:h-auto shrink-0 border border-border bg-bg-panel rounded-md flex flex-col min-h-0">
          <div className="p-3 border-b border-border flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Поиск по имени или ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Поиск авторов по имени или ID"
                  className="w-full pl-8 pr-3 py-1 text-xs rounded border border-border bg-bg-main text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
              <Button
                variant="primary"
                size="xs"
                icon={<Plus size={14} />}
                onClick={() => setShowAddForm(!showAddForm)}
                aria-label="Добавить автора"
              />
            </div>

            <AddAuthorForm
              expanded={showAddForm}
              addVkId={addVkId}
              setAddVkId={setAddVkId}
              onSubmit={handleAddAuthor}
              error={addError}
              isSubmitting={createAuthorMutation.isPending}
              onClose={() => setShowAddForm(false)}
            />
          </div>

          {/* Список с обработкой скелетонов и ошибок */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loadingAuthors ? (
              <AuthorListSkeleton />
            ) : hasAuthorsError ? (
              <div className="p-6">
                <ErrorState error={authorsError} onRetry={retryFetchAuthors} />
              </div>
            ) : filteredAuthors.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">
                {searchQuery ? 'Ничего не найдено' : 'Список авторов пуст'}
              </div>
            ) : (
              filteredAuthors.map((author) => (
                <AuthorItem
                  key={author.id}
                  author={author}
                  isSelected={author.id === selectedAuthorId}
                  onClick={() => {
                    setSelectedAuthorId(author.id)
                    setConfirmDeleteId(null)
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Правая колонка: Детали и лента подозрительных комментариев */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 border border-border bg-bg-panel rounded-md flex flex-col min-h-0">
          {!selectedAuthorId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Bookmark size={36} className="text-text-muted mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-text-primary">Автор не выбран</p>
              <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
                Выберите автора в левой колонке, чтобы просмотреть его подозрительную активность, ленту комментариев и управлять отслеживанием.
              </p>
            </div>
          ) : loadingDetails ? (
            <AuthorDetailsSkeleton />
          ) : hasDetailsError ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <ErrorState error={detailsError} onRetry={retryFetchDetails} />
            </div>
          ) : authorDetails ? (
            <>
              {/* Шапка детального просмотра */}
              <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-sidebar">
                <div className="flex items-center gap-3">
                  {authorDetails.author?.photo50 ? (
                    <img
                      src={authorDetails.author.photo50}
                      alt={authorDetails.author.fullName}
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-full border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-text-secondary shrink-0">
                      <User size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-text-primary truncate">
                        {authorDetails.author?.fullName || `VK ID: ${authorDetails.authorVkId}`}
                      </h2>
                      <a
                        href={authorDetails.author?.profileUrl || `https://vk.com/id${authorDetails.authorVkId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent transition-colors shrink-0"
                        title="Открыть профиль VK"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary">
                      <span className={`px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase text-[8px] border shrink-0 ${
                        authorDetails.status === 'STOPPED' 
                          ? 'bg-bg-hover text-text-muted border-border'
                          : 'bg-success-soft text-success border-success/30'
                      }`}>
                        {authorDetails.status === 'STOPPED' ? 'Мониторинг приостановлен' : 'Активно отслеживается'}
                      </span>
                      {authorDetails.author?.city && (
                        <span className="truncate">• {authorDetails.author.city.title}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Действия управления автором */}
                <div className="flex items-center gap-2 shrink-0">
                  {authorDetails.status === 'ACTIVE' ? (
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={<Square size={12} />}
                      onClick={() => toggleStatusMutation.mutate({ id: authorDetails.id, status: 'STOPPED' })}
                      disabled={toggleStatusMutation.isPending}
                    >
                      Приостановить
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      semantic="default"
                      size="xs"
                      icon={<Play size={12} />}
                      onClick={() => toggleStatusMutation.mutate({ id: authorDetails.id, status: 'ACTIVE' })}
                      disabled={toggleStatusMutation.isPending}
                    >
                      Запустить
                    </Button>
                  )}

                  {confirmDeleteId === authorDetails.id ? (
                    <ConfirmAction
                      message="Удалить из списка?"
                      confirmLabel="Удалить"
                      cancelLabel="Отмена"
                      isLoading={deleteAuthorMutation.isPending}
                      onConfirm={() => deleteAuthorMutation.mutate(authorDetails.id)}
                      onCancel={() => setConfirmDeleteId(null)}
                    />
                  ) : (
                    <Button
                      variant="secondary"
                      semantic="danger"
                      size="xs"
                      icon={<Trash2 size={12} />}
                      onClick={() => setConfirmDeleteId(authorDetails.id)}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </div>

              {/* Лента подозрительных комментариев */}
              <div className="flex-1 flex flex-col min-h-0 bg-bg-main">
                <div className="p-3 border-b border-border bg-bg-panel flex items-center justify-between text-xs text-text-secondary font-medium">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-text-muted" />
                    Найдено комментариев: {authorDetails.comments.total}
                  </span>
                  <span className="font-mono text-[10px]">
                    ID отслеживания: {authorDetails.id}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {authorDetails.comments.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <MessageSquare size={24} className="text-text-muted mb-1" />
                      <p className="text-xs font-semibold text-text-primary">Комментарии не найдены</p>
                      <p className="text-[10px] text-text-muted max-w-xs mt-0.5 leading-relaxed">
                        {authorDetails.status === 'STOPPED'
                          ? 'Мониторинг приостановлен. Запустите его, чтобы опрашивать новые комментарии.'
                          : 'С момента добавления автора подозрительных комментариев не зафиксировано.'}
                      </p>
                    </div>
                  ) : (
                    authorDetails.comments.items.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-text-muted">
              Не удалось загрузить данные по автору.
            </div>
          )}
        </div>
      </div>
      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />
    </PageShell>
  )
}
