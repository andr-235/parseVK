import { useMemo } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { AuthorCard, AuthorSortField, TableColumn } from '@/types'
import { resolveCityLabel } from '@/utils/authors/authorUtils'
import { ArrowRight, Camera, Trash2 } from 'lucide-react'
import { formatDateTime, getAuthorInitials } from '@/utils/common'
import { DataTableCard } from '@/components/common/DataTableCard'
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

export function AuthorsTableCard({
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

  const columns = useMemo<TableColumn<AuthorCard>[]>(() => [
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
      }
    },
    {
      header: 'Город',
      key: 'city',
      sortable: true,
      cellClassName: 'w-[200px] text-sm text-muted-foreground',
      render: (author) => resolveCityLabel(author.city) ?? '—'
    },
    {
      header: 'Фото',
      key: 'photosCount',
      sortable: true,
      render: (author) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {formatMetricValue(author.photosCount)}
          </span>
          {author.summary.suspicious > 0 && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
              Подозр: {formatMetricValue(author.summary.suspicious)}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Аудио',
      key: 'audiosCount',
      sortable: true,
      cellClassName: 'text-sm text-muted-foreground',
      render: (author) => formatMetricValue(author.audiosCount)
    },
    {
      header: 'Видео',
      key: 'videosCount',
      sortable: true,
      cellClassName: 'text-sm text-muted-foreground',
      render: (author) => formatMetricValue(author.videosCount)
    },
    {
      header: 'Друзья',
      key: 'friendsCount',
      sortable: true,
      cellClassName: 'text-sm text-muted-foreground',
      render: (author) => formatMetricValue(author.friendsCount)
    },
    {
      header: 'Подписчики',
      key: 'followersCount',
      sortable: true,
      cellClassName: 'text-sm text-muted-foreground',
      render: (author) => formatMetricValue(author.followersCount)
    },
    {
      header: 'Дата входа',
      key: 'lastSeenAt',
      sortable: true,
      cellClassName: 'text-sm text-muted-foreground',
      render: (author) => formatDateTime(author.lastSeenAt)
    },
    {
      header: 'Дата проверки',
      key: 'verifiedAt',
      sortable: true,
      cellClassName: 'text-sm text-muted-foreground',
      render: (author) => formatDateTime(author.verifiedAt)
    },
    {
      header: 'Действия',
      key: 'actions',
      headerClassName: 'text-right sticky right-0 bg-muted/30 backdrop-blur-sm z-10',
      cellClassName: 'text-right sticky right-0 bg-card z-10 group-hover:bg-muted/50 transition-colors',
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
      )
    }
  ], [
    onAnalyzePhotos,
    onDeleteAuthor,
    onOpenDetails,
    onVerifyAuthor,
    isAnalyzing,
    analyzingVkUserId,
    deletingVkUserId
  ])

  return (
    <DataTableCard
      title="Авторы"
      hideHeader
      isLoading={isLoading && authors.length === 0}
      loadingMessage="Загружаем авторов…"
      isEmpty={showEmptyState}
      emptyIcon="👥"
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      contentClassName="p-0!"
    >
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
    </DataTableCard>
  )
}
