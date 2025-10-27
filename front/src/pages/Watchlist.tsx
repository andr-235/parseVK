import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { TableSortButton } from '@/components/ui/table-sort-button'
import { Spinner } from '@/components/ui/spinner'
import { useTableSorting } from '@/hooks/useTableSorting'
import { useWatchlistStore } from '@/stores'
import type {
  TableColumn,
  WatchlistAuthorCard,
  WatchlistComment,
  PhotoAnalysisSummaryCategory,
} from '@/types'

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

const getPrimitiveColumnValue = (
  item: unknown,
  key: string,
): string | number | boolean | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const value = record[key]

  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  return null
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
  const navigate = useNavigate()

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

  const authorColumns = useMemo<TableColumn<WatchlistAuthorCard>[]>(() => [
    {
      header: 'Автор',
      key: 'author',
      sortable: true,
      sortValue: (item) => item.author?.fullName?.toLowerCase() ?? '',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-text-primary">{item.author.fullName}</span>
          <a
            href={item.author.profileUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-secondary hover:text-primary"
          >
            vk.com/{item.author.vkUserId}
          </a>
        </div>
      ),
    },
    {
      header: 'Статус',
      key: 'status',
      sortable: true,
      sortValue: (item) => item.status,
      render: (item) => (
        <Badge variant="outline">{formatStatus(item.status)}</Badge>
      ),
    },
    {
      header: 'Анализ фото',
      key: 'analysisSummary',
      sortable: true,
      sortValue: (item) => item.analysisSummary?.suspicious ?? 0,
      cellClassName: 'max-w-xs',
      render: (item) => {
        const summary = item.analysisSummary
        const lastAnalyzed = summary.lastAnalyzedAt
          ? formatDateTime(summary.lastAnalyzedAt)
          : '—'

        return (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1">
              {summary.categories.map((category: PhotoAnalysisSummaryCategory) => (
                <Badge
                  key={category.name}
                  variant={category.count > 0 ? 'destructive' : 'outline'}
                  className={
                    category.count > 0
                      ? 'border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium'
                      : 'border-border/60 text-xs text-text-secondary'
                  }
                >
                  {category.name}: {category.count}
                </Badge>
              ))}
            </div>
            <span className="text-xs text-text-secondary">
              Подозрительных: {summary.suspicious} · Последний анализ: {lastAnalyzed}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Найдено',
      key: 'foundCommentsCount',
      sortable: true,
      sortValue: (item) => item.foundCommentsCount,
      render: (item) => item.foundCommentsCount,
    },
    {
      header: 'Всего',
      key: 'totalComments',
      sortable: true,
      sortValue: (item) => item.totalComments,
      render: (item) => item.totalComments,
    },
    {
      header: 'Последняя активность',
      key: 'lastActivityAt',
      sortable: true,
      sortValue: (item) => (item.lastActivityAt ? new Date(item.lastActivityAt) : null),
      render: (item) => formatDateTime(item.lastActivityAt),
    },
    {
      header: 'Последняя проверка',
      key: 'lastCheckedAt',
      sortable: true,
      sortValue: (item) => (item.lastCheckedAt ? new Date(item.lastCheckedAt) : null),
      render: (item) => formatDateTime(item.lastCheckedAt),
    },
    {
      header: 'Действия',
      key: 'actions',
      sortable: false,
      render: (item: WatchlistAuthorCard) => (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              handleSelectAuthor(item.id)
            }}
          >
            Подробнее
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/authors/${item.author.vkUserId}/analysis`, {
                state: {
                  author: item.author,
                  summary: item.analysisSummary,
                },
              })
            }}
          >
            Анализ фото
          </Button>
        </div>
      ),
    },
  ], [handleSelectAuthor, navigate])

  const {
    sortedItems: sortedAuthors,
    sortState: authorSortState,
    requestSort: requestAuthorSort,
  } = useTableSorting(authors, authorColumns, {
    initialKey: 'lastActivityAt',
    initialDirection: 'desc',
  })

  const commentColumns = useMemo<TableColumn<WatchlistComment>[]>(() => [
    {
      header: 'Дата',
      key: 'publishedAt',
      sortable: true,
      sortValue: (item) => {
        const timestamp = item.publishedAt ?? item.createdAt
        return timestamp ? new Date(timestamp) : null
      },
      render: (item) => formatDateTime(item.publishedAt ?? item.createdAt),
    },
    {
      header: 'Источник',
      key: 'source',
      sortable: true,
      sortValue: (item) => item.source,
      render: (item) => formatCommentSource(item),
    },
    {
      header: 'Комментарий',
      key: 'text',
      sortable: false,
      cellClassName: 'max-w-xl whitespace-pre-wrap text-sm text-text-primary',
      render: (item) => item.text || '—',
    },
    {
      header: 'Ссылка',
      key: 'commentUrl',
      sortable: false,
      render: (item) => (
        item.commentUrl ? (
          <a
            href={item.commentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Открыть
          </a>
        ) : (
          <span className="text-xs text-text-secondary">—</span>
        )
      ),
    },
  ], [])

  const commentItems = currentAuthor?.comments.items ?? []
  const {
    sortedItems: sortedComments,
    sortState: commentSortState,
    requestSort: requestCommentSort,
  } = useTableSorting(commentItems, commentColumns, {
    initialKey: 'publishedAt',
    initialDirection: 'desc',
  })

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
                {authorColumns.map((column) => (
                  <TableHead key={column.key} className={column.headerClassName}>
                    {column.sortable ? (
                      <TableSortButton
                        direction={authorSortState?.key === column.key ? authorSortState.direction : null}
                        onClick={() => requestAuthorSort(column.key)}
                      >
                        {column.header}
                      </TableSortButton>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAuthors.map((author, index) => (
                <TableRow key={author.id ?? index} className="cursor-pointer hover:bg-muted/40" onClick={() => handleSelectAuthor(author.id)}>
                  {authorColumns.map((column) => (
                    <TableCell key={column.key} className={column.cellClassName}>
                      {column.render
                        ? column.render(author, index)
                        : getPrimitiveColumnValue(author, column.key) ?? column.emptyValue ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>
              Показано {sortedAuthors.length} авторов из {totalAuthors}.
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
                    {commentColumns.map((column) => (
                      <TableHead key={column.key} className={column.headerClassName}>
                        {column.sortable ? (
                          <TableSortButton
                            direction={commentSortState?.key === column.key ? commentSortState.direction : null}
                            onClick={() => requestCommentSort(column.key)}
                          >
                            {column.header}
                          </TableSortButton>
                        ) : (
                          column.header
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedComments.map((comment, index) => (
                    <TableRow key={comment.id ?? index}>
                      {commentColumns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.render
                            ? column.render(comment, index)
                            : getPrimitiveColumnValue(comment, column.key) ?? column.emptyValue ?? '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Показано {sortedComments.length} комментариев из {currentAuthor.comments.total}.
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
