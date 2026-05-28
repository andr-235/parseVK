import { memo, useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWatchlistViewModel } from '@/hooks/watchlist/useWatchlistViewModel'
import { PageHeader, SectionCard } from '@/components/common'
import { DataTableCard } from '@/components/common/DataTableCard'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff, RefreshCw, Clock, Users, Loader2 } from 'lucide-react'
import { cn } from '@/utils/common'
import { WATCHLIST_CONSTANTS } from '@/config/watchlist/watchlist'
import {
  isValidWatchlistSettings,
  filterValidAuthors,
  validateAuthorId,
  formatDateTime,
  formatStatus,
} from '@/utils/watchlist/watchlistUtils'
import { logger } from '@/utils/watchlist/logger'
import { PHOTO_ANALYSIS_LABELS } from '@/config/authorAnalysis/photoAnalysisConstants'
import type {
  WatchlistAuthorCard,
  WatchlistAuthorDetails as WatchlistAuthorDetailsType,
  WatchlistComment,
  PhotoAnalysisSummaryCategory,
  TableColumn,
} from '@/types'
import toast from 'react-hot-toast'
import { useTableSorting } from '@/hooks/common'

interface AuthorCellProps {
  item: WatchlistAuthorCard
}

export const AuthorCell = ({ item }: AuthorCellProps) => {
  if (!item.author) {
    return <span className="text-text-secondary">{WATCHLIST_CONSTANTS.AUTHOR_NOT_FOUND}</span>
  }
  return (
    <div className="flex flex-col">
      <span className="font-medium text-text-primary">{item.author.fullName}</span>
      <a
        href={item.author.profileUrl ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-text-secondary hover:text-primary"
      >
        {WATCHLIST_CONSTANTS.VK_BASE_URL}
        {item.author.vkUserId}
      </a>
    </div>
  )
}

const getBadgeVariant = (count: number) => {
  if (count > 5) return 'destructive'
  if (count > 0) return 'secondary'
  return 'outline'
}

const getBadgeClassName = (count: number) => {
  if (count > 5) {
    return 'border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium'
  }
  if (count > 0) {
    return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 text-xs font-medium'
  }
  return 'border-border/60 text-xs text-text-secondary'
}

interface PhotoAnalysisCellProps {
  item: WatchlistAuthorCard
}

export const PhotoAnalysisCell = ({ item }: PhotoAnalysisCellProps) => {
  const summary = item.analysisSummary
  if (!summary || !summary.categories) {
    return <span className="text-text-secondary">{WATCHLIST_CONSTANTS.NO_DATA}</span>
  }
  const lastAnalyzed = summary.lastAnalyzedAt
    ? formatDateTime(summary.lastAnalyzedAt)
    : WATCHLIST_CONSTANTS.NO_DATA

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {summary.categories.map((category: PhotoAnalysisSummaryCategory) => (
          <Badge
            key={category.name}
            variant={getBadgeVariant(category.count)}
            className={getBadgeClassName(category.count)}
          >
            {category.name}: {category.count}
          </Badge>
        ))}
      </div>
      <span className="text-xs text-text-secondary">
        {PHOTO_ANALYSIS_LABELS.SUSPICIOUS_LABEL}: {summary.suspicious} ·{' '}
        {PHOTO_ANALYSIS_LABELS.LAST_ANALYSIS_LABEL}: {lastAnalyzed}
      </span>
    </div>
  )
}

interface ActionsCellProps {
  item: WatchlistAuthorCard
  handleSelectAuthor: (id: number) => void
  handleRemoveFromWatchlist: (id: number) => void
  pendingRemoval: Record<number, boolean>
}

export const ActionsCell = ({
  item,
  handleSelectAuthor,
  handleRemoveFromWatchlist,
  pendingRemoval,
}: ActionsCellProps) => {
  const navigate = useNavigate()

  return (
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
          if (item.author) {
            navigate(`/authors/${item.author.vkUserId}/analysis`, {
              state: {
                author: item.author,
                summary: item.analysisSummary,
              },
            })
          }
        }}
      >
        Анализ фото
      </Button>
      {item.status !== WATCHLIST_CONSTANTS.STOPPED_STATUS ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={Boolean(pendingRemoval[item.id])}
          onClick={(event) => {
            event.stopPropagation()
            handleRemoveFromWatchlist(item.id)
          }}
        >
          {pendingRemoval[item.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {pendingRemoval[item.id]
            ? WATCHLIST_CONSTANTS.REMOVING_TEXT
            : WATCHLIST_CONSTANTS.REMOVE_TEXT}
        </Button>
      ) : null}
    </div>
  )
}

interface WatchlistTableCardProps {
  authors: WatchlistAuthorCard[]
  totalAuthors: number
  hasMoreAuthors: boolean
  isLoadingAuthors: boolean
  isLoadingMoreAuthors: boolean
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  onSelectAuthor: (id: number) => void
  onLoadMore: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
  onRefresh?: () => void
}

export const WatchlistTableCard = memo(
  ({
    authors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    authorColumns,
    onSelectAuthor,
    onLoadMore,
    searchTerm,
    onSearchChange,
    onRefresh,
  }: WatchlistTableCardProps) => {
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const validAuthors = useMemo(() => filterValidAuthors(authors), [authors])

    const {
      sortedItems: sortedAuthors,
      sortState: authorSortState,
      requestSort: requestAuthorSort,
    } = useTableSorting(validAuthors, authorColumns.length > 0 ? authorColumns : [], {
      initialKey: authorColumns.length > 0 ? 'lastActivityAt' : '',
      initialDirection: 'desc',
    })

    const handleSelectAuthor = useCallback(
      (author: WatchlistAuthorCard) => {
        try {
          if (validateAuthorId(author.id)) {
            onSelectAuthor(author.id)
          } else {
            logger.error(`Невалидный ID автора:`, author.id)
            toast.error('Невалидный ID автора')
          }
        } catch (error) {
          logger.error(`Ошибка при выборе автора с ID ${author.id}:`, error)
          toast.error('Не удалось выбрать автора. Попробуйте ещё раз.')
        }
      },
      [onSelectAuthor]
    )

    const handleLoadMore = useCallback(async () => {
      if (isLoadingMore || !hasMoreAuthors || isLoadingAuthors || isLoadingMoreAuthors) {
        return
      }

      setIsLoadingMore(true)
      try {
        await onLoadMore()
      } finally {
        setIsLoadingMore(false)
      }
    }, [isLoadingMore, hasMoreAuthors, isLoadingAuthors, isLoadingMoreAuthors, onLoadMore])

    const isLoading = isLoadingAuthors && !authors.length
    const isEmpty = !isLoadingAuthors && sortedAuthors.length === 0
    const hasData = sortedAuthors.length > 0 && authorColumns.length > 0

    const badgeText = useMemo(() => {
      return searchTerm.trim() ? `${sortedAuthors.length} из ${totalAuthors}` : `${totalAuthors}`
    }, [sortedAuthors.length, totalAuthors, searchTerm])

    const headerActions = useMemo(() => {
      if (!onRefresh) return null
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoadingAuthors}
          className="h-10 text-muted-foreground hover:text-primary"
          title="Обновить список"
        >
          <RefreshCw className={`mr-2 size-4 ${isLoadingAuthors ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      )
    }, [onRefresh, isLoadingAuthors])

    return (
      <DataTableCard
        title="Авторы"
        badgeText={badgeText}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Поиск автора..."
        headerActions={headerActions}
        isLoading={isLoading}
        loadingMessage="Загружаем список авторов…"
        isEmpty={isEmpty}
        emptyIcon="👥"
        emptyTitle="Список наблюдения пуст"
        emptyDescription={
          WATCHLIST_CONSTANTS.EMPTY_AUTHORS_MESSAGE ||
          'Добавьте авторов для отслеживания их активности.'
        }
        contentClassName="p-0!"
      >
        <div aria-live="polite" aria-atomic="true" className="sr-only" key="aria-live">
          {isLoadingMoreAuthors && 'Загружаем дополнительные авторы...'}
          {hasData && `Загружено ${sortedAuthors.length} авторов из ${totalAuthors}`}
        </div>

        {hasData && (
          <div className="flex flex-col">
            <DataTable
              data={sortedAuthors}
              columns={authorColumns}
              isLoading={isLoadingAuthors}
              sortState={authorSortState}
              onRequestSort={requestAuthorSort}
              onRowClick={(item) => handleSelectAuthor(item)}
            />
            <div className="flex justify-center py-4 border-t border-border/40 bg-muted/10">
              {hasMoreAuthors ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingAuthors || isLoadingMoreAuthors || isLoadingMore}
                >
                  {isLoadingMoreAuthors || isLoadingMore ? 'Загружаем...' : 'Загрузить ещё'}
                </Button>
              ) : (
                <span className="text-xs text-text-secondary font-monitoring-body">
                  Показано {sortedAuthors.length} авторов
                </span>
              )}
            </div>
          </div>
        )}
      </DataTableCard>
    )
  }
)

interface WatchlistAuthorDetailsProps {
  currentAuthor: WatchlistAuthorDetailsType | null
  isLoadingAuthorDetails: boolean
  commentColumns: TableColumn<WatchlistComment>[]
}

export const WatchlistAuthorDetails = ({
  currentAuthor,
  isLoadingAuthorDetails,
  commentColumns,
}: WatchlistAuthorDetailsProps) => {
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
    <SectionCard
      title="Активность автора"
      description={
        currentAuthor
          ? currentAuthor.author.fullName
          : 'Выберите автора, чтобы увидеть историю комментариев'
      }
    >
      {isLoadingAuthorDetails && !currentAuthor ? (
        <div key="loading-author-details" className="flex items-center justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : null}

      {currentAuthor ? (
        <div key="author-details-content" className="flex flex-col gap-6">
          <div key="author-info" className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <span>Статус: {formatStatus(currentAuthor.status)}</span>
            <span>Найдено комментариев: {currentAuthor.foundCommentsCount}</span>
            <span>Всего сохранено: {currentAuthor.totalComments}</span>
            <span>Последняя проверка: {formatDateTime(currentAuthor.lastCheckedAt)}</span>
          </div>

          {currentAuthor.comments.items.length > 0 ? (
            <div className="flex flex-col gap-4">
              <DataTable
                data={sortedComments}
                columns={commentColumns}
                sortState={commentSortState}
                onRequestSort={requestCommentSort}
              />
              <div className="text-center text-xs text-text-secondary font-monitoring-body pb-2">
                Показано {sortedComments.length} комментариев из {currentAuthor.comments.total}
              </div>
            </div>
          ) : (
            <div key="no-comments" className="py-6 text-sm text-text-secondary">
              Пока нет комментариев, найденных мониторингом.
            </div>
          )}
        </div>
      ) : !isLoadingAuthorDetails ? (
        <div key="select-author" className="py-6 text-sm text-text-secondary">
          Выберите автора из списка, чтобы увидеть историю его комментариев.
        </div>
      ) : null}
    </SectionCard>
  )
}

function WatchlistPage() {
  const {
    filteredAuthors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    currentAuthor,
    isLoadingAuthorDetails,
    settings,
    isUpdatingSettings,
    searchTerm,
    setSearchTerm,
    authorColumns,
    commentColumns,
    handleRefresh,
    handleLoadMore,
    handleToggleTrackAll,
    handleSelectAuthor,
  } = useWatchlistViewModel()

  const trackingEnabled = settings?.trackAllComments ?? false

  const renderHeader = () => {
    if (!settings) {
      return <div className="text-slate-400">{WATCHLIST_CONSTANTS.LOADING_SETTINGS_TEXT}</div>
    }

    if (!isValidWatchlistSettings(settings)) {
      return <div className="text-red-400">{WATCHLIST_CONSTANTS.INVALID_SETTINGS_ERROR}</div>
    }

    return (
      <PageHeader
        variant="grid"
        colsClass="grid-cols-1 gap-4 md:grid-cols-3"
        title={
          <>
            Авторы <span className="text-accent-primary">на карандаше</span>
          </>
        }
        description="Отслеживайте активность выбранных авторов в комментариях. Система автоматически проверяет новые комментарии от этих пользователей во всех отслеживаемых группах."
        actions={
          <Button
            onClick={handleRefresh}
            size="lg"
            variant="outline"
            className="h-11 shrink-0 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50 transition-all duration-200"
            disabled={isLoadingAuthors}
          >
            <RefreshCw className={cn('mr-2 w-5 h-5', isLoadingAuthors && 'animate-spin')} />
            Обновить
          </Button>
        }
        cards={[
          {
            icon: Users,
            title: 'Статус мониторинга',
            subtitle: '',
            bgGradientClass: 'from-accent-primary/5 to-background-secondary',
            customContent: (
              <div className="flex flex-col justify-between gap-5 h-full w-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-monitoring-display font-semibold text-white">
                        Статус мониторинга
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          'uppercase text-[10px] tracking-wider font-semibold rounded-full font-mono-accent',
                          trackingEnabled
                            ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                            : 'border border-amber-500/25 bg-amber-500/10 text-amber-400'
                        )}
                      >
                        {trackingEnabled ? 'Активен' : 'Пауза'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      {trackingEnabled
                        ? 'Система отслеживает новые комментарии от выбранных авторов'
                        : 'Отслеживание приостановлено, обновление временных меток продолжается'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                        Интервал проверки
                      </span>
                      <span className="font-semibold text-slate-200">
                        {settings.pollIntervalMinutes} мин
                      </span>
                    </div>
                  </div>

                  <div className="w-px h-8 bg-border/60" />

                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                        Макс. авторов/цикл
                      </span>
                      <span className="font-semibold text-slate-200">{settings.maxAuthors}</span>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            icon: Eye,
            title: 'Режим отслеживания',
            subtitle: '',
            customContent: (
              <div className="flex flex-col gap-4 h-full w-full justify-center min-h-[140px]">
                <div className="space-y-1">
                  <h3 className="font-monitoring-display text-sm font-semibold text-white">
                    Режим отслеживания
                  </h3>
                  <p className="text-xs text-slate-500">
                    Всего авторов:{' '}
                    <span className="font-mono-accent text-slate-300">{totalAuthors || 0}</span>
                  </p>
                </div>

                <Button
                  className={cn(
                    'h-12 w-full text-base font-medium transition-all duration-200',
                    trackingEnabled
                      ? 'bg-primary text-white shadow-soft-sm hover:bg-orange-600'
                      : 'border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50'
                  )}
                  onClick={handleToggleTrackAll}
                  disabled={isUpdatingSettings}
                  variant={trackingEnabled ? 'default' : 'outline'}
                >
                  {isUpdatingSettings ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : trackingEnabled ? (
                    <EyeOff className="w-5 h-5 mr-2" />
                  ) : (
                    <Eye className="w-5 h-5 mr-2" />
                  )}
                  {isUpdatingSettings
                    ? 'Сохранение...'
                    : trackingEnabled
                      ? 'Приостановить'
                      : 'Активировать'}
                </Button>
              </div>
            ),
          },
        ]}
      />
    )
  }

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        {renderHeader()}
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Список авторов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <WatchlistTableCard
          authors={filteredAuthors}
          totalAuthors={totalAuthors}
          hasMoreAuthors={hasMoreAuthors}
          isLoadingAuthors={isLoadingAuthors}
          isLoadingMoreAuthors={isLoadingMoreAuthors}
          authorColumns={authorColumns}
          onSelectAuthor={handleSelectAuthor}
          onLoadMore={handleLoadMore}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={handleRefresh}
        />
      </div>

      {currentAuthor && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
          <WatchlistAuthorDetails
            currentAuthor={currentAuthor}
            isLoadingAuthorDetails={isLoadingAuthorDetails}
            commentColumns={commentColumns}
          />
        </div>
      )}
    </div>
  )
}

export default WatchlistPage
