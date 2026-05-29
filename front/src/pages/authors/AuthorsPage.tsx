import { useMemo } from 'react'
import { PageHeader, FiltersPanel, PageContainer } from '@/components/common'
import { useAuthorsViewModel } from '@/pages/authors/hooks/useAuthorsViewModel'
import { Users, Shield, Microscope, RefreshCw, ArrowRight, Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/shared/utils'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { AuthorCard, AuthorSortField, TableColumn } from '@/shared/types'
import { resolveCityLabel } from '@/pages/authors/utils/authorUtils'
import { formatDateTime, getAuthorInitials } from '@/shared/utils'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable } from '@/components/common/DataTable'

interface AuthorsTableCardProps {
  authors: AuthorCard[]
  isLoading: boolean
  sortBy: AuthorSortField
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: AuthorSortField) => void
  onOpenDetails: (author: AuthorCard) => void
  onAnalyzePhotos: (author: AuthorCard) => void
  onDeleteAuthor: (author: AuthorCard) => void
  onVerifyAuthor: (author: AuthorCard) => void
  deletingVkUserId: number | null
  analyzingVkUserId: number | null
  isAnalyzing: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  emptyTitle: string
  emptyDescription: string
}

const numberFormatter = new Intl.NumberFormat('ru-RU')

const formatMetricValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—'
  }
  return numberFormatter.format(value)
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

function AuthorsTableCard({
  authors,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
  onOpenDetails,
  onAnalyzePhotos,
  onDeleteAuthor,
  onVerifyAuthor,
  analyzingVkUserId,
  deletingVkUserId,
  isAnalyzing,
  hasMore,
  isLoadingMore,
  onLoadMore,
  emptyTitle,
  emptyDescription,
}: AuthorsTableCardProps) {
  const showEmptyState = !isLoading && authors.length === 0

  const columns = useMemo<TableColumn<AuthorCard>[]>(
    () => [
      {
        header: 'Автор',
        key: 'fullName',
        sortable: true,
        cellClassName: 'w-[300px]',
        render: (author) => {
          const profileUrl = resolveProfileUrl(author)
          const avatarUrl = author.photo200 ?? author.photo100 ?? author.photo50 ?? undefined
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={author.fullName} />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {getAuthorInitials(author.fullName)}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {author.fullName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {author.screenName ? `@${author.screenName}` : `id${author.vkUserId}`}
                  </span>
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary/80 hover:text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onVerifyAuthor(author)
                    }}
                    onAuxClick={(e) => {
                      if (e.button !== 1) {
                        return
                      }
                      e.stopPropagation()
                      onVerifyAuthor(author)
                    }}
                  >
                    VK
                  </a>
                </div>
              </div>
            </div>
          )
        },
      },
      {
        header: 'Город',
        key: 'city',
        sortable: true,
        cellClassName: 'w-[200px] text-sm text-muted-foreground',
        render: (author) => resolveCityLabel(author.city) ?? '—',
      },
      {
        header: 'Фото',
        key: 'photosCount',
        sortable: true,
        render: (author) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{formatMetricValue(author.photosCount)}</span>
            {author.summary.suspicious > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                Подозр: {formatMetricValue(author.summary.suspicious)}
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Аудио',
        key: 'audiosCount',
        sortable: true,
        cellClassName: 'text-sm text-muted-foreground',
        render: (author) => formatMetricValue(author.audiosCount),
      },
      {
        header: 'Видео',
        key: 'videosCount',
        sortable: true,
        cellClassName: 'text-sm text-muted-foreground',
        render: (author) => formatMetricValue(author.videosCount),
      },
      {
        header: 'Друзья',
        key: 'friendsCount',
        sortable: true,
        cellClassName: 'text-sm text-muted-foreground',
        render: (author) => formatMetricValue(author.friendsCount),
      },
      {
        header: 'Подписчики',
        key: 'followersCount',
        sortable: true,
        cellClassName: 'text-sm text-muted-foreground',
        render: (author) => formatMetricValue(author.followersCount),
      },
      {
        header: 'Дата входа',
        key: 'lastSeenAt',
        sortable: true,
        cellClassName: 'text-sm text-muted-foreground',
        render: (author) => formatDateTime(author.lastSeenAt),
      },
      {
        header: 'Дата проверки',
        key: 'verifiedAt',
        sortable: true,
        cellClassName: 'text-sm text-muted-foreground',
        render: (author) => formatDateTime(author.verifiedAt),
      },
      {
        header: 'Действия',
        key: 'actions',
        headerClassName: 'text-right sticky right-0 bg-muted/30 backdrop-blur-sm z-10',
        cellClassName:
          'text-right sticky right-0 bg-card z-10 group-hover:bg-muted/50 transition-colors',
        render: (author) => (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onAnalyzePhotos(author)}
              disabled={isAnalyzing && analyzingVkUserId === author.vkUserId}
              title="Анализ фотографий"
            >
              {isAnalyzing && analyzingVkUserId === author.vkUserId ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => onDeleteAuthor(author)}
              disabled={deletingVkUserId === author.vkUserId}
              title="Удалить автора и его комментарии"
            >
              {deletingVkUserId === author.vkUserId ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
              onClick={() => onOpenDetails(author)}
              title="Открыть детали"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [
      onAnalyzePhotos,
      onDeleteAuthor,
      onOpenDetails,
      onVerifyAuthor,
      isAnalyzing,
      analyzingVkUserId,
      deletingVkUserId,
    ]
  )

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border bg-background-secondary shadow-soft-sm">
      <CardContent className="p-0">
        {showEmptyState ? (
          <EmptyState
            icon="👥"
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <>
            <DataTable
              data={authors}
              columns={columns}
              isLoading={isLoading}
              sortState={{ key: sortBy, direction: sortOrder }}
              onRequestSort={(key) => onSortChange(key as AuthorSortField)}
            />

            {hasMore && (
              <div className="flex justify-center py-4 border-t border-border/40 bg-muted/10">
                <Button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

function AuthorsPage() {
  const {
    authors,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    searchValue,
    statusFilter,
    cityValue,
    cityOptions,
    sortBy,
    sortOrder,
    analyzingVkUserId,
    isAnalyzing,
    emptyTitle,
    emptyDescription,
    handleSearchChange,
    handleStatusFilterChange,
    handleCityFilterChange,
    handleLoadMore,
    handleRefresh,
    handleOpenDetails,
    handleAnalyzePhotos,
    handleDeleteAuthor,
    deletingVkUserId,
    handleVerifyAuthor,
    handleSortChange,
  } = useAuthorsViewModel()

  const pageCards = [
    {
      icon: Users,
      title: 'Всего авторов',
      subtitle: '',
      customContent: (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide font-mono-accent">
            Всего авторов
          </p>
          <p className="font-monitoring-display text-2xl font-bold text-text-light">
            {authors.length.toLocaleString('ru-RU')}
          </p>
        </div>
      ),
    },
    { icon: Shield, title: 'Проверка', subtitle: 'Управление статусами верификации' },
    { icon: Microscope, title: 'Анализ фото', subtitle: 'AI-анализ изображений профилей' },
    { icon: Users, title: 'Профили', subtitle: 'Детальная информация и активность' },
  ]

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Авторы <span className="text-accent-primary">ВКонтакте</span>
            </>
          }
          description="База авторов, собранная через парсинг и мониторинг. Управляйте статусами проверки и анализируйте профили для выявления подозрительной активности."
          actions={
            <Button
              onClick={handleRefresh}
              size="lg"
              variant="outline"
              className="h-11 shrink-0 border-border bg-background-secondary text-text-primary hover:bg-background-primary hover:border-accent-primary/50 transition-all duration-200"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('mr-2 w-5 h-5', isRefreshing && 'animate-spin')} />
              Обновить
            </Button>
          }
          cards={pageCards}
        />
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Фильтры</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <FiltersPanel
          searchTerm={searchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Поиск по имени, домену или ID..."
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing || isLoading}
        >
          <div className="flex items-center rounded-lg bg-background-primary p-1 border border-border">
            {(['all', 'verified', 'unverified'] as const).map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                onClick={() => handleStatusFilterChange(filter)}
                className={cn(
                  'h-7 rounded-md px-3 text-xs font-medium transition-all',
                  statusFilter === filter
                    ? 'bg-background-secondary shadow-sm text-text-light'
                    : 'text-text-secondary hover:text-text-light'
                )}
              >
                {filter === 'all' ? 'Все' : filter === 'verified' ? 'Проверенные' : 'Непроверенные'}
              </Button>
            ))}
          </div>

          <div className="flex min-w-[220px] flex-1 items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">
              Город
            </span>
            <Input
              value={cityValue}
              onChange={(event) => handleCityFilterChange(event.target.value)}
              placeholder="Любой"
              list="authors-city-options"
              className="h-9 rounded-lg border-border bg-background-primary text-sm focus-visible:ring-1 focus-visible:ring-accent-primary/30"
            />
            <datalist id="authors-city-options">
              {cityOptions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </FiltersPanel>
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            База авторов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <AuthorsTableCard
          authors={authors}
          isLoading={isLoading}
          sortBy={sortBy ?? 'fullName'}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onOpenDetails={handleOpenDetails}
          onAnalyzePhotos={handleAnalyzePhotos}
          onDeleteAuthor={handleDeleteAuthor}
          onVerifyAuthor={handleVerifyAuthor}
          deletingVkUserId={deletingVkUserId}
          analyzingVkUserId={analyzingVkUserId}
          isAnalyzing={isAnalyzing}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
    </PageContainer>
  )
}

export default AuthorsPage
