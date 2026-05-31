import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { CommentCategoryFilters } from './CommentCategoryFilters'
import { CommentCategorySection } from './CommentCategorySection'
import { CommentGroupedList } from './CommentGroupedList'
import { CommentLoadMore } from './CommentLoadMore'
import useCommentsTableCardController from '@/pages/comments/hooks/useCommentsTableCardController'
import type { CategorizedComment, CategorizedGroup } from '@/pages/comments/types/commentsTable'

interface CommentsTableCardProps {
  groupedComments: CategorizedGroup[]
  commentsWithoutKeywords: CategorizedComment[]
  commentIndexMap: Map<number, number>
  isLoading: boolean
  emptyMessage: string
  toggleReadStatus: (id: number) => Promise<void>
  onLoadMore: () => void
  hasMore: boolean
  isLoadingMore: boolean
  totalCount: number
  loadedCount: number
  renderedCount: number
  onAddToWatchlist?: (commentId: number) => void
  watchlistPending?: Record<number, boolean>
}

const CommentsTableCard = memo(function CommentsTableCard({
  groupedComments,
  commentsWithoutKeywords,
  commentIndexMap,
  isLoading,
  emptyMessage,
  toggleReadStatus,
  onLoadMore,
  hasMore,
  isLoadingMore,
  totalCount,
  loadedCount,
  renderedCount,
  onAddToWatchlist,
  watchlistPending,
}: CommentsTableCardProps) {
  const {
    keywordGroups,
    hasComments,
    hasKeywordGroups,
    hasCommentsWithoutKeywords,
    expandedCategories,
    toggleCategory,
    activeCategory,
    availableCategories,
    selectCategory,
    filteredCommentsWithoutKeywords,
  } = useCommentsTableCardController({
    groupedComments,
    commentsWithoutKeywords,
  })

  const [bulkMarking, setBulkMarking] = useState(false)

  const handleMarkAllAsRead = useCallback(async () => {
    setBulkMarking(true)
    const ids = keywordGroups.flatMap((g) =>
      g.comments.map((c) => c.comment.id)
    ).concat(
      filteredCommentsWithoutKeywords.map((c) => c.comment.id)
    )
    const uniqueIds = Array.from(new Set(ids))
    for (const id of uniqueIds) {
      try {
        await toggleReadStatus(id)
      } catch {
        // individual errors are handled by toggleReadStatus
      }
    }
    setBulkMarking(false)
  }, [keywordGroups, filteredCommentsWithoutKeywords, toggleReadStatus])

  const observerTargetRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  const hasMoreRef = useRef(hasMore)
  const isLoadingMoreRef = useRef(isLoadingMore)
  const autoLoadConsumedRef = useRef(false)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
    hasMoreRef.current = hasMore
    isLoadingMoreRef.current = isLoadingMore
  }, [onLoadMore, hasMore, isLoadingMore])

  useEffect(() => {
    if (!isLoadingMore) return
    autoLoadConsumedRef.current = true
  }, [isLoadingMore])

  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMore || !hasComments) return
    const target = observerTargetRef.current
    if (!target) return
    const timeoutId = setTimeout(() => {
      const rect = target.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight + 200
      if (isInViewport && hasMoreRef.current && !isLoadingMoreRef.current && !autoLoadConsumedRef.current) {
        autoLoadConsumedRef.current = true
        onLoadMoreRef.current()
      }
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [isLoading, isLoadingMore, hasMore, hasComments])

  useIntersectionObserver(
    observerTargetRef,
    () => {
      if (hasMoreRef.current && !isLoadingMoreRef.current) {
        onLoadMoreRef.current()
      }
    },
    {
      enabled: hasComments && hasMore,
      threshold: 0.1,
      rootMargin: '200px',
    }
  )

  return (
    <div>
      {isLoading && !hasComments && <LoadingState message="Загружаем комментарии…" useCard />}

      {!isLoading && !hasComments && (
        <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="Нет данных" description={emptyMessage} />
      )}

      {hasComments && (
        <>
          {hasKeywordGroups && (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                {availableCategories.length > 0 && (
                  <CommentCategoryFilters
                    categories={availableCategories}
                    activeCategory={activeCategory}
                    onSelectCategory={selectCategory}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={bulkMarking}
                  onClick={handleMarkAllAsRead}
                  className="h-7 shrink-0 gap-1.5 px-2.5 font-mono-accent text-xs font-medium text-text-secondary hover:bg-background-primary/40 hover:text-text-light"
                >
                  {bulkMarking ? (
                    <Spinner className="size-3" />
                  ) : (
                    <MessageSquare className="size-3" />
                  )}
                  Отметить все
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/60 bg-background-secondary/30">
                {keywordGroups.map((group) => (
                  <CommentCategorySection
                    key={group.category}
                    category={group.category}
                    count={group.comments.length}
                    isExpanded={expandedCategories[group.category] ?? true}
                    onToggle={() => toggleCategory(group.category)}
                  >
                    <CommentGroupedList
                      items={group.comments}
                      commentIndexMap={commentIndexMap}
                      toggleReadStatus={toggleReadStatus}
                      onAddToWatchlist={onAddToWatchlist}
                      watchlistPending={watchlistPending}
                    />
                  </CommentCategorySection>
                ))}
              </div>
            </>
          )}

          {hasCommentsWithoutKeywords && (
            <div className="mt-8 border-t border-border/30 pt-4">
              {hasKeywordGroups && (
                <h3 className="mb-1 font-mono-accent text-[10px] font-bold uppercase tracking-wider text-text-secondary/40">
                  Остальные комментарии
                </h3>
              )}

              <div className="divide-y divide-border/20">
                <CommentGroupedList
                  items={filteredCommentsWithoutKeywords}
                  commentIndexMap={commentIndexMap}
                  toggleReadStatus={toggleReadStatus}
                  onAddToWatchlist={onAddToWatchlist}
                  watchlistPending={watchlistPending}
                />
              </div>
            </div>
          )}

          <CommentLoadMore
            ref={observerTargetRef}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadedCount={loadedCount}
            renderedCount={renderedCount}
            totalCount={totalCount}
            onLoadMore={onLoadMore}
          />
        </>
      )}
    </div>
  )
})

export default CommentsTableCard
