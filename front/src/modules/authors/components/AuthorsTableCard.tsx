import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { TableSortButton } from '@/shared/ui/table-sort-button'
import { Spinner } from '@/shared/ui/spinner'
import { Button } from '@/shared/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import type { AuthorCard, AuthorSortField } from '@/types'
import { resolveCityLabel } from '@/modules/authors/utils/authorUtils'
import { ArrowRight, Camera, Search, Trash2 } from 'lucide-react'

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
  const resolveSortDirection = (field: AuthorSortField) => (sortBy === field ? sortOrder : null)

  const showEmptyState = !isLoading && authors.length === 0

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[300px]">
                <TableSortButton
                  onClick={() => onSortChange('fullName')}
                  direction={resolveSortDirection('fullName')}
                  className="justify-start"
                >
                  Автор
                </TableSortButton>
              </TableHead>
              <TableHead className="w-[200px]">
                <TableSortButton
                  onClick={() => onSortChange('city')}
                  direction={resolveSortDirection('city')}
                  className="justify-start"
                >
                  Город
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => onSortChange('photosCount')}
                  direction={resolveSortDirection('photosCount')}
                >
                  Фото
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => onSortChange('audiosCount')}
                  direction={resolveSortDirection('audiosCount')}
                >
                  Аудио
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => onSortChange('videosCount')}
                  direction={resolveSortDirection('videosCount')}
                >
                  Видео
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => onSortChange('friendsCount')}
                  direction={resolveSortDirection('friendsCount')}
                >
                  Друзья
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => onSortChange('followersCount')}
                  direction={resolveSortDirection('followersCount')}
                >
                  Подписчики
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => onSortChange('lastSeenAt')}
                  direction={resolveSortDirection('lastSeenAt')}
                >
                  Дата входа
                </TableSortButton>
              </TableHead>
              <TableHead>
                <TableSortButton
                  onClick={() => onSortChange('verifiedAt')}
                  direction={resolveSortDirection('verifiedAt')}
                >
                  Дата проверки
                </TableSortButton>
              </TableHead>
              <TableHead className="text-right sticky right-0 bg-muted/30 backdrop-blur-sm z-10">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && authors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <div className="flex w-full justify-center py-12">
                    <Spinner className="h-8 w-8 text-primary/60" />
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {authors.map((author) => {
              const profileUrl = resolveProfileUrl(author)
              const avatarUrl = author.photo200 ?? author.photo100 ?? author.photo50 ?? undefined
              const cityLabel = resolveCityLabel(author.city)

              return (
                <TableRow key={author.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/20">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={author.fullName} />
                        ) : (
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {getInitials(author.firstName, author.lastName)}
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
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {cityLabel ?? '—'}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatMetricValue(author.audiosCount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatMetricValue(author.videosCount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatMetricValue(author.friendsCount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatMetricValue(author.followersCount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTimeCell(author.lastSeenAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTimeCell(author.verifiedAt)}
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-card z-10 group-hover:bg-muted/50 transition-colors">
                    <div className="flex justify-end gap-2">
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
                  </TableCell>
                </TableRow>
              )
            })}

            {showEmptyState ? (
              <TableRow>
                <TableCell colSpan={10} className="h-[300px]">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground">{emptyTitle}</p>
                      <p className="max-w-xs text-sm text-muted-foreground mx-auto mt-1">
                        {emptyDescription}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

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
    </div>
  )
}
