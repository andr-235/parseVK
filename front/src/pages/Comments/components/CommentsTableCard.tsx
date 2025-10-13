import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { Comment, Keyword } from '@/types'
import LoadingCommentsState from './LoadingCommentsState'
import EmptyCommentsState from './EmptyCommentsState'
import CommentCard from './CommentCard'

interface CommentsTableCardProps {
  comments: Comment[]
  isLoading: boolean
  emptyMessage: string
  keywords: Keyword[]
  toggleReadStatus: (id: number) => Promise<void>
  onLoadMore: () => void
  hasMore: boolean
  isLoadingMore: boolean
  totalCount: number
  loadedCount: number
  onAddToWatchlist?: (commentId: number) => void
  watchlistPending?: Record<number, boolean>
}

function CommentsTableCard({
  comments,
  isLoading,
  emptyMessage,
  keywords,
  toggleReadStatus,
  onLoadMore,
  hasMore,
  isLoadingMore,
  totalCount,
  loadedCount,
  onAddToWatchlist,
  watchlistPending,
}: CommentsTableCardProps) {
  const hasComments = comments.length > 0
  const totalAvailable = Math.max(totalCount, loadedCount)

  const subtitle = useMemo(() => {
    if (isLoading && !hasComments) {
      return 'Мы подготавливаем данные и проверяем их перед отображением.'
    }

    if (hasComments) {
      return 'Ниже отображаются комментарии из добавленных групп. Вы можете отметить их как прочитанные или искать по ключевым словам.'
    }

    return 'После добавления групп и запуска парсинга комментарии появятся в списке.'
  }, [hasComments, isLoading])

  return (
    <Card
      className="rounded-[26px] bg-background-secondary shadow-[0_24px_48px_-34px_rgba(0,0,0,0.28)] dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]"
      aria-label="Список комментариев"
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-6 space-y-0 p-6 md:p-8">
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <CardTitle className="text-2xl font-bold text-text-primary">Список комментариев</CardTitle>
          <CardDescription className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
            {subtitle}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-8 md:pb-8">
        {isLoading && !hasComments && <LoadingCommentsState />}

        {!isLoading && !hasComments && <EmptyCommentsState message={emptyMessage} />}

        {hasComments && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {comments.map((comment, index) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  index={index}
                  keywords={keywords}
                  toggleReadStatus={toggleReadStatus}
                  onAddToWatchlist={onAddToWatchlist}
                  isWatchlistLoading={Boolean(watchlistPending?.[comment.id])}
                />
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">
                Отображается {comments.length} комментариев. Загружено {loadedCount}
                {totalAvailable > 0 ? ` из ${totalAvailable}` : ''}.
              </p>

              {hasMore && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 self-start sm:self-auto"
                  onClick={onLoadMore}
                  disabled={isLoading || isLoadingMore}
                >
                  {isLoadingMore && <Spinner className="size-4" aria-hidden="true" />}
                  {isLoadingMore ? 'Загружаем…' : 'Загрузить ещё'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CommentsTableCard
