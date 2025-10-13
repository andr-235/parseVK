import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { useWatchlistStore } from '@/stores'
import type { WatchlistAuthorCard, WatchlistComment } from '@/types'

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatStatus = (status: WatchlistAuthorCard['status']): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Активен'
    case 'PAUSED':
      return 'Приостановлен'
    case 'STOPPED':
      return 'Отключен'
    default:
      return status
  }
}

const formatCommentSource = (comment: WatchlistComment): string => {
  if (comment.source === 'WATCHLIST') {
    return 'Мониторинг'
  }

  return 'Задачи'
}

function Watchlist() {
  const authors = useWatchlistStore((state) => state.authors)
  const totalAuthors = useWatchlistStore((state) => state.totalAuthors)
  const hasMoreAuthors = useWatchlistStore((state) => state.hasMoreAuthors)
  const isLoadingAuthors = useWatchlistStore((state) => state.isLoadingAuthors)
  const isLoadingMoreAuthors = useWatchlistStore((state) => state.isLoadingMoreAuthors)
  const fetchAuthors = useWatchlistStore((state) => state.fetchAuthors)
  const selectedAuthor = useWatchlistStore((state) => state.selectedAuthor)
  const isLoadingAuthorDetails = useWatchlistStore((state) => state.isLoadingAuthorDetails)
  const fetchAuthorDetails = useWatchlistStore((state) => state.fetchAuthorDetails)
  const settings = useWatchlistStore((state) => state.settings)
  const fetchSettings = useWatchlistStore((state) => state.fetchSettings)
  const updateSettings = useWatchlistStore((state) => state.updateSettings)
  const isUpdatingSettings = useWatchlistStore((state) => state.isUpdatingSettings)

  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAuthors({ reset: true })
      } catch (error) {
        console.error('Не удалось загрузить список авторов', error)
      }

      try {
        await fetchSettings()
      } catch (error) {
        console.error('Не удалось загрузить настройки мониторинга', error)
      }
    }

    void load()
  }, [fetchAuthors, fetchSettings])

  useEffect(() => {
    if (selectedAuthorId === null) {
      return
    }

    const loadDetails = async () => {
      try {
        await fetchAuthorDetails(selectedAuthorId)
      } catch (error) {
        console.error('Не удалось загрузить детали автора', error)
      }
    }

    void loadDetails()
  }, [fetchAuthorDetails, selectedAuthorId])

  const currentAuthor = useMemo(() => {
    if (!selectedAuthor || selectedAuthorId === null) {
      return null
    }

    return selectedAuthor.id === selectedAuthorId ? selectedAuthor : null
  }, [selectedAuthor, selectedAuthorId])

  const handleRefresh = useCallback(() => {
    const refresh = async () => {
      try {
        await fetchAuthors({ reset: true })
      } catch (error) {
        console.error('Не удалось обновить список авторов', error)
      }
    }

    void refresh()
  }, [fetchAuthors])

  const handleLoadMore = useCallback(() => {
    const loadMore = async () => {
      try {
        await fetchAuthors({ reset: false })
      } catch (error) {
        console.error('Не удалось загрузить дополнительный список авторов', error)
      }
    }

    void loadMore()
  }, [fetchAuthors])

  const handleToggleTrackAll = useCallback(() => {
    if (!settings) {
      return
    }

    const toggle = async () => {
      try {
        await updateSettings({ trackAllComments: !settings.trackAllComments })
      } catch (error) {
        console.error('Не удалось изменить настройку мониторинга', error)
      }
    }

    void toggle()
  }, [settings, updateSettings])

  const handleSelectAuthor = useCallback((id: number) => {
    setSelectedAuthorId(id)
  }, [])

  const heroDescription = useMemo(() => {
    if (!settings) {
      return 'Загрузка настроек мониторинга авторов…'
    }

    const polling = settings.pollIntervalMinutes
    return `Список авторов «На карандаше». Проверка активности каждые ${polling} мин., лимит одновременно обновляемых авторов — ${settings.maxAuthors}.`
  }, [settings])

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Авторы на карандаше"
        description={heroDescription}
        actions={(
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={handleRefresh} disabled={isLoadingAuthors}>
              Обновить список
            </Button>
            <Button
              type="button"
              variant={settings?.trackAllComments ? 'default' : 'outline'}
              onClick={handleToggleTrackAll}
              disabled={!settings || isUpdatingSettings}
            >
              {isUpdatingSettings
                ? 'Сохраняем…'
                : settings?.trackAllComments
                  ? 'Отключить мониторинг всех комментариев'
                  : 'Включить мониторинг всех комментариев'}
            </Button>
          </div>
        )}
        footer={[
          <Badge key="authors" variant="secondary" className="bg-white/20 text-text-primary">
            Авторов: {totalAuthors}
          </Badge>,
          settings ? (
            <Badge key="interval" variant="outline">
              Интервал: {settings.pollIntervalMinutes} мин.
            </Badge>
          ) : null,
        ].filter(Boolean)}
      />

      <SectionCard
        title="Список авторов"
        description="Добавленные авторы и статистика найденных комментариев"
        headerActions={(
          hasMoreAuthors ? (
            <Button type="button" variant="outline" onClick={handleLoadMore} disabled={isLoadingAuthors || isLoadingMoreAuthors}>
              {isLoadingMoreAuthors ? 'Загружаем…' : 'Загрузить ещё'}
            </Button>
          ) : null
        )}
      >
        {isLoadingAuthors && !authors.length ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : null}

        {!isLoadingAuthors && authors.length === 0 ? (
          <div className="py-6 text-center text-sm text-text-secondary">
            Добавьте автора из карточки комментария, чтобы начать мониторинг.
          </div>
        ) : null}

        {authors.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Автор</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Найдено</TableHead>
                <TableHead>Всего</TableHead>
                <TableHead>Последняя активность</TableHead>
                <TableHead>Последняя проверка</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authors.map((author) => (
                <TableRow key={author.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handleSelectAuthor(author.id)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-text-primary">{author.author.fullName}</span>
                      <a
                        href={author.author.profileUrl ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-text-secondary hover:text-primary"
                      >
                        vk.com/{author.author.vkUserId}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatStatus(author.status)}</Badge>
                  </TableCell>
                  <TableCell>{author.foundCommentsCount}</TableCell>
                  <TableCell>{author.totalComments}</TableCell>
                  <TableCell>{formatDateTime(author.lastActivityAt)}</TableCell>
                  <TableCell>{formatDateTime(author.lastCheckedAt)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleSelectAuthor(author.id)}>
                      Подробнее
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>
              Показано {authors.length} авторов из {totalAuthors}.
            </TableCaption>
          </Table>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Активность автора"
        description={currentAuthor ? currentAuthor.author.fullName : 'Выберите автора, чтобы увидеть историю комментариев'}
      >
        {isLoadingAuthorDetails && !currentAuthor ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : null}

        {currentAuthor ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              <span>Статус: {formatStatus(currentAuthor.status)}</span>
              <span>Найдено комментариев: {currentAuthor.foundCommentsCount}</span>
              <span>Всего сохранено: {currentAuthor.totalComments}</span>
              <span>Последняя проверка: {formatDateTime(currentAuthor.lastCheckedAt)}</span>
            </div>

            {currentAuthor.comments.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Источник</TableHead>
                    <TableHead>Комментарий</TableHead>
                    <TableHead>Ссылка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAuthor.comments.items.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>{formatDateTime(comment.publishedAt ?? comment.createdAt)}</TableCell>
                      <TableCell>{formatCommentSource(comment)}</TableCell>
                      <TableCell className="max-w-xl whitespace-pre-wrap text-sm text-text-primary">
                        {comment.text || '—'}
                      </TableCell>
                      <TableCell>
                        {comment.commentUrl ? (
                          <a
                            href={comment.commentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Открыть
                          </a>
                        ) : (
                          <span className="text-xs text-text-secondary">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Показано {currentAuthor.comments.items.length} комментариев из {currentAuthor.comments.total}.
                </TableCaption>
              </Table>
            ) : (
              <div className="py-6 text-sm text-text-secondary">
                Пока нет комментариев, найденных мониторингом.
              </div>
            )}
          </div>
        ) : !isLoadingAuthorDetails ? (
          <div className="py-6 text-sm text-text-secondary">
            Выберите автора из списка, чтобы увидеть историю его комментариев.
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Watchlist
