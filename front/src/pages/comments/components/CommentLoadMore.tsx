import { memo, forwardRef } from 'react'
import { Spinner } from '@/shared/components/ui/spinner'
import { declOfNumber } from '@/shared/utils'

interface CommentLoadMoreProps {
  hasMore: boolean
  isLoadingMore: boolean
  loadedCount: number
  renderedCount: number
  totalCount: number
  onLoadMore: () => void
}

export const CommentLoadMore = memo(
  forwardRef<HTMLDivElement, CommentLoadMoreProps>(function CommentLoadMore(
    { hasMore, isLoadingMore, loadedCount, renderedCount, totalCount, onLoadMore },
    ref,
  ) {
    return (
      <div
        role="button"
        tabIndex={hasMore ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasMore && !isLoadingMore) {
            e.preventDefault()
            onLoadMore()
          }
        }}
        className={`mt-4 flex min-h-[36px] flex-col items-center gap-2 text-center transition-opacity ${hasMore && !isLoadingMore ? 'cursor-pointer hover:opacity-70' : ''}`}
        onClick={() => {
          if (hasMore && !isLoadingMore) onLoadMore()
        }}
      >
        <p className="font-mono-accent text-xs text-text-secondary/50">
          Загружено {loadedCount} · Показано {renderedCount} · Всего{' '}
          {totalCount.toLocaleString('ru-RU')}{' '}
          {declOfNumber(totalCount, ['комментарий', 'комментария', 'комментариев'])}
        </p>

        <div ref={ref} className="flex w-full justify-center py-1.5">
          {hasMore && isLoadingMore && (
            <div className="flex items-center gap-2 font-mono-accent text-xs text-text-secondary animate-in fade-in duration-150">
              <Spinner className="size-3" />
              Загрузка...
            </div>
          )}
        </div>
      </div>
    )
  })
)
