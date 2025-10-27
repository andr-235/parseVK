import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import SearchInput from '@/components/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSortButton } from '@/components/ui/table-sort-button'
import { Spinner } from '@/components/ui/spinner'
import { useAuthorsStore, usePhotoAnalysisStore } from '@/stores'
import type { AuthorCard, AuthorSortField } from '@/types'

const STATUS_FILTER_OPTIONS: Array<{
  label: string
  value: 'unverified' | 'verified' | 'all'
}> = [
  { label: 'Непроверенные', value: 'unverified' },
  { label: 'Проверенные', value: 'verified' },
  { label: 'Все', value: 'all' },
]

const STATUS_FILTER_LABELS: Record<'unverified' | 'verified' | 'all', string> = {
  unverified: 'Фильтр: непроверенные',
  verified: 'Фильтр: проверенные',
  all: 'Фильтр: все авторы',
}

const numberFormatter = new Intl.NumberFormat('ru-RU')

const formatMetricValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—'
  }

  return numberFormatter.format(value)
}

const formatDateTimeCell = (value: string | null | undefined): string => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.[0] ?? ''
  const last = lastName?.[0] ?? ''
  return `${first}${last}`.toUpperCase() || 'VK'
}

const resolveProfileUrl = (author: AuthorCard): string => {
  if (author.profileUrl) {
    return author.profileUrl
  }

  if (author.domain) {
    return `https://vk.com/${author.domain}`
  }

  if (author.screenName) {
    return `https://vk.com/${author.screenName}`
  }

  return `https://vk.com/id${author.vkUserId}`
}

function Authors() {
  const authors = useAuthorsStore((state) => state.authors)
  const total = useAuthorsStore((state) => state.total)
  const hasMore = useAuthorsStore((state) => state.hasMore)
  const isLoading = useAuthorsStore((state) => state.isLoading)
  const isLoadingMore = useAuthorsStore((state) => state.isLoadingMore)
  const isRefreshing = useAuthorsStore((state) => state.isRefreshing)
  const fetchAuthors = useAuthorsStore((state) => state.fetchAuthors)
  const loadMore = useAuthorsStore((state) => state.loadMore)
  const refreshAuthors = useAuthorsStore((state) => state.refreshAuthors)
  const storeSearch = useAuthorsStore((state) => state.search)
  const setStoreSearch = useAuthorsStore((state) => state.setSearch)
  const statusFilter = useAuthorsStore((state) => state.statusFilter)
  const setStatusFilter = useAuthorsStore((state) => state.setStatusFilter)
  const sortBy = useAuthorsStore((state) => state.sortBy)
  const sortOrder = useAuthorsStore((state) => state.sortOrder)
  const setSort = useAuthorsStore((state) => state.setSort)
  const analyzeAuthor = usePhotoAnalysisStore((state) => state.analyzeAuthor)
  const isAnalyzing = usePhotoAnalysisStore((state) => state.isAnalyzing)

  const [analyzingVkUserId, setAnalyzingVkUserId] = useState<number | null>(null)

  const [searchValue, setSearchValue] = useState(storeSearch)
  const isInitialSearch = useRef(true)

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAuthors({ reset: true })
      } catch (error) {
        console.error('Не удалось загрузить список авторов', error)
      }
    }

    void load()
  }, [fetchAuthors, statusFilter])

  useEffect(() => {
    setStoreSearch(searchValue)

    if (isInitialSearch.current) {
      isInitialSearch.current = false
      return
    }

    const timeoutId = window.setTimeout(() => {
      fetchAuthors({ search: searchValue, reset: true }).catch((error) => {
        console.error('Не удалось выполнить поиск авторов', error)
      })
    }, 400)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchValue, fetchAuthors, setStoreSearch])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const handleStatusFilterChange = useCallback(
    (value: 'unverified' | 'verified' | 'all') => {
      if (value === statusFilter) {
        return
      }

      setStatusFilter(value)
    },
    [setStatusFilter, statusFilter]
  )

  const handleLoadMore = useCallback(() => {
    loadMore().catch((error) => {
      console.error('Не удалось загрузить дополнительные записи авторов', error)
    })
  }, [loadMore])

  const handleRefresh = useCallback(() => {
    refreshAuthors().catch((error) => {
      console.error('Не удалось обновить таблицу авторов', error)
    })
  }, [refreshAuthors])

  const handleAnalyzePhotos = useCallback(
    async (author: AuthorCard) => {
      if (isAnalyzing) {
        return
      }

      setAnalyzingVkUserId(author.vkUserId)

      const totalPhotos = typeof author.photosCount === 'number' ? author.photosCount : null
      let analyzedTotal = author.summary.total

      try {
        if (totalPhotos !== null && analyzedTotal >= totalPhotos) {
          toast.success('Все фото уже были проанализированы ранее')
          return
        }

        while (true) {
          const remaining = totalPhotos !== null ? Math.max(totalPhotos - analyzedTotal, 0) : null
          if (remaining !== null && remaining === 0) {
            break
          }

          const batchLimit = remaining !== null ? Math.max(Math.min(remaining, 50), 1) : 50
          const response = await analyzeAuthor(author.vkUserId, { limit: batchLimit })
          const newTotal = response.total
          const processedInBatch = newTotal - analyzedTotal

          if (processedInBatch <= 0) {
            break
          }

          analyzedTotal = newTotal

          if (totalPhotos !== null && analyzedTotal >= totalPhotos) {
            break
          }

          if (processedInBatch < batchLimit) {
            break
          }
        }

        try {
          await fetchAuthors({ reset: true })
        } catch (updateError) {
          console.error('Не удалось обновить данные автора после анализа', updateError)
          toast.error('Не удалось обновить данные автора после анализа')
        }
        toast.success('Анализ фотографий выполнен')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Не удалось выполнить анализ фотографий автора'
        toast.error(message)
        console.error('Ошибка анализа фотографий автора', error)
      } finally {
        setAnalyzingVkUserId(null)
      }
    },
    [analyzeAuthor, fetchAuthors, isAnalyzing],
  )

  const handleSortChange = useCallback(
    (field: AuthorSortField) => {
      setSort(field)
    },
    [setSort],
  )

  const resolveSortDirection = useCallback(
    (field: AuthorSortField) => (sortBy === field ? sortOrder : null),
    [sortBy, sortOrder],
  )

  const displayedCount = useMemo(() => authors.length, [authors])

  const heroFooter = useMemo(() => {
    const filterLabel = STATUS_FILTER_LABELS[statusFilter]

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
          В базе: {total}
        </Badge>
        <Badge variant="secondary" className="text-text-primary">
          Показано: {displayedCount}
        </Badge>
        <Badge variant="outline" className="border-border/50 text-text-secondary">
          {filterLabel}
        </Badge>
      </div>
    )
  }, [total, displayedCount, statusFilter])

  const showEmptyState = !isLoading && authors.length === 0
  const emptyTitle = statusFilter === 'unverified' ? 'Нет авторов для проверки' : 'Авторы не найдены'
  const emptyDescription = statusFilter === 'unverified'
    ? 'Все найденные авторы уже отмечены как проверенные. Попробуйте сменить фильтр или обновить данные.'
    : 'Попробуйте изменить фильтр или уточнить поисковый запрос.'

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Авторы ВКонтакте"
        description="Таблица авторов, сохранённых после парсинга и мониторинга. Видно ключевые метрики профиля и активность."
        footer={heroFooter}
      />

      <SectionCard
        title="Сводка по авторам"
        description="Поиск поддерживает имя, фамилию, короткий адрес и числовой идентификатор VK. Метрики собираются из последнего обновления профиля."
        headerActions={
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-72">
                <SearchInput
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Поиск по имени, домену или ID"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={statusFilter === option.value ? 'default' : 'outline'}
                    onClick={() => handleStatusFilterChange(option.value)}
                    disabled={statusFilter === option.value}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="secondary"
              disabled={isRefreshing || isLoading}
            >
              {isRefreshing ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Обновление...
                </span>
              ) : (
                'Обновить'
              )}
            </Button>
          </div>
        }
        contentClassName="space-y-6"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('fullName')}
                  direction={resolveSortDirection('fullName')}
                  className="justify-start"
                >
                  Автор
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('photosCount')}
                  direction={resolveSortDirection('photosCount')}
                >
                  Фото
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('audiosCount')}
                  direction={resolveSortDirection('audiosCount')}
                >
                  Аудио
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('videosCount')}
                  direction={resolveSortDirection('videosCount')}
                >
                  Видео
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('friendsCount')}
                  direction={resolveSortDirection('friendsCount')}
                >
                  Друзья
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('followersCount')}
                  direction={resolveSortDirection('followersCount')}
                >
                  Подписчики
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('lastSeenAt')}
                  direction={resolveSortDirection('lastSeenAt')}
                >
                  Дата входа
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => handleSortChange('verifiedAt')}
                  direction={resolveSortDirection('verifiedAt')}
                >
                  Дата проверки
                </TableSortButton>
              </TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && authors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex w-full justify-center py-10">
                    <Spinner className="h-6 w-6" />
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {authors.map((author) => {
              const profileUrl = resolveProfileUrl(author)
              const avatarUrl = author.photo200 ?? author.photo100 ?? author.photo50 ?? undefined

              return (
                <TableRow key={author.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border border-border/20">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={author.fullName} />
                        ) : (
                          <AvatarFallback>{getInitials(author.firstName, author.lastName)}</AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-text-primary">{author.fullName}</span>
                        <span className="text-xs text-text-secondary">
                          {author.screenName ? `@${author.screenName}` : `id${author.vkUserId}`}
                        </span>
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent-primary hover:underline"
                        >
                          Открыть профиль
                        </a>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-text-primary">
                        {formatMetricValue(author.photosCount)}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Подозрительные: {formatMetricValue(author.summary.suspicious)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatMetricValue(author.audiosCount)}</TableCell>
                  <TableCell>{formatMetricValue(author.videosCount)}</TableCell>
                  <TableCell>{formatMetricValue(author.friendsCount)}</TableCell>
                  <TableCell>{formatMetricValue(author.followersCount)}</TableCell>
                  <TableCell>{formatDateTimeCell(author.lastSeenAt)}</TableCell>
                  <TableCell>{formatDateTimeCell(author.verifiedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAnalyzePhotos(author)}
                      disabled={isAnalyzing && analyzingVkUserId === author.vkUserId}
                    >
                      {isAnalyzing && analyzingVkUserId === author.vkUserId ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" />
                          Анализ...
                        </span>
                      ) : (
                        'Анализ фото'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}

            {showEmptyState ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background-primary/40 px-6 py-12 text-center text-text-secondary">
                    <p className="text-lg font-medium text-text-primary">{emptyTitle}</p>
                    <p className="max-w-md text-sm">{emptyDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
          <TableCaption>
            Нажмите «Анализ», чтобы перейти на подробную страницу автора и пометить его как проверенного.
          </TableCaption>
        </Table>

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline">
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Загрузка...
                </span>
              ) : (
                'Загрузить ещё'
              )}
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default Authors
