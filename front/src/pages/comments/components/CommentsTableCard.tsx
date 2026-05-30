import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'
import { ChevronDown, ChevronUp, Eye, MessageSquare } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import CommentCard from './CommentCard'
import { PostGroupCard } from './PostGroupCard'
import { CommentCategoryFilters } from './CommentCategoryFilters'
import useCommentsTableCardController from '@/pages/comments/hooks/useCommentsTableCardController'
import type { CategorizedComment, CategorizedGroup } from '@/pages/comments/types/commentsTable'
import { declOfNumber } from '@/shared/utils'

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
  showKeywordComments: boolean
  showKeywordPosts: boolean
  hasDefinedKeywords: boolean
  onAddToWatchlist?: (commentId: number) => void
  watchlistPending?: Record<number, boolean>
  keywordCommentsTotal: number
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
  showKeywordComments,
  showKeywordPosts,
  hasDefinedKeywords,
  onAddToWatchlist,
  watchlistPending,
  keywordCommentsTotal,
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
    subtitle,
  } = useCommentsTableCardController({
    groupedComments,
    commentsWithoutKeywords,
    isLoading,
    showKeywordComments,
    showKeywordPosts,
    hasDefinedKeywords,
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
    if (!isLoadingMore) {
      return
    }

    autoLoadConsumedRef.current = true
  }, [isLoadingMore])

  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMore || !hasComments) return

    const target = observerTargetRef.current
    if (!target) return

    const timeoutId = setTimeout(() => {
      const rect = target.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight + 200

      if (
        isInViewport &&
        hasMoreRef.current &&
        !isLoadingMoreRef.current &&
        !autoLoadConsumedRef.current
      ) {
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

  function CommentsContainer({ children }: { children: React.ReactNode }) {
    return (
      <div className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-background-secondary/40 shadow-soft-sm">
        {children}
      </div>
    )
  }

  const renderCommentsList = useCallback(
    (items: CategorizedComment[]) => {
      const postGroups = new Map<string, CategorizedComment[]>()
      const standaloneItems: CategorizedComment[] = []

      items.forEach((item) => {
        const hasPostMatch = item.matchedKeywords.some((kw) => kw.source === 'POST')
        const hasPostData = item.comment.postText || item.comment.postGroup
        const shouldGroupByPost = showKeywordPosts && hasPostMatch && hasPostData

        if (shouldGroupByPost) {
          const key =
            (item.comment.postText || '') +
            (item.comment.postGroup?.id || item.comment.id.toString())
          if (!postGroups.has(key)) {
            postGroups.set(key, [])
          }
          postGroups.get(key)!.push(item)
        } else {
          standaloneItems.push(item)
        }
      })

      return (
        <>
          {Array.from(postGroups.entries()).map(([key, groupItems]) => {
            const first = groupItems[0].comment
            return (
              <PostGroupCard
                key={`post-group-${key}`}
                postText={first.postText}
                postAttachments={first.postAttachments}
                postGroup={first.postGroup}
                comments={groupItems.map((i) => ({
                  comment: i.comment,
                  matchedKeywords: i.matchedKeywords,
                  index: commentIndexMap.get(i.comment.id) ?? 0,
                }))}
                toggleReadStatus={toggleReadStatus}
                onAddToWatchlist={onAddToWatchlist}
                watchlistPending={watchlistPending}
                showKeywordComments={showKeywordComments}
                showKeywordPosts={showKeywordPosts}
                onCategoryClick={selectCategory}
              />
            )
          })}
          {standaloneItems.map(({ comment, matchedKeywords }) => {
            const commentIndex = commentIndexMap.get(comment.id) ?? 0
            return (
              <CommentCard
                key={`comment-${comment.id}-${commentIndex}`}
                comment={comment}
                index={commentIndex}
                matchedKeywords={matchedKeywords}
                toggleReadStatus={toggleReadStatus}
                onAddToWatchlist={onAddToWatchlist}
                isWatchlistLoading={Boolean(watchlistPending?.[comment.id])}
                showKeywordComments={showKeywordComments}
                showKeywordPosts={showKeywordPosts}
                onCategoryClick={selectCategory}
              />
            )
          })}
        </>
      )
    },
    [
      commentIndexMap,
      onAddToWatchlist,
      showKeywordComments,
      showKeywordPosts,
      selectCategory,
      toggleReadStatus,
      watchlistPending,
    ]
  )

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-6 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-monitoring-display text-xl font-semibold tracking-tight text-white">
              Лента комментариев
            </CardTitle>
            <CardDescription className="mt-1.5 font-monitoring-body text-text-secondary">
              {subtitle}
              {keywordCommentsTotal > 0 && (
                <span className="ml-2 inline-flex items-center rounded-md border border-accent-info/20 bg-accent-info/10 px-2 py-1 font-mono-accent text-xs font-medium text-accent-info">
                  {keywordCommentsTotal} с ключами
                </span>
              )}
            </CardDescription>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {isLoading ? (
              <Spinner className="size-4 text-text-secondary" />
            ) : (
              <Badge
                variant="secondary"
                className="border-border/60 bg-background-secondary font-mono-accent font-normal text-text-secondary"
              >
                Всего по фильтру: {totalCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-8">
        <CommentCategoryFilters
          categories={availableCategories}
          activeCategory={activeCategory}
          onSelectCategory={selectCategory}
        />

        {isLoading && !hasComments && <LoadingState message="Загружаем комментарии…" useCard />}

        {!isLoading && !hasComments && (
          <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Нет данных" description={emptyMessage} />
        )}

        {hasComments && (
          <>
            {hasKeywordGroups && (
              <>
                {hasComments && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono-accent text-xs text-text-secondary">
                      {hasKeywordGroups ? 'Группировка по категориям' : 'Комментарии'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={bulkMarking}
                      onClick={handleMarkAllAsRead}
                      className="h-8 gap-2 px-3 font-mono-accent text-xs font-medium text-text-secondary hover:bg-background-primary/40 hover:text-text-light"
                    >
                      {bulkMarking ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      Отметить все как прочитанные
                    </Button>
                  </div>
                )}
                <div className="space-y-6">
                  {keywordGroups.map((group) => {
                    const isExpanded = expandedCategories[group.category] ?? true

                    return (
                      <div key={group.category} className="space-y-2">
                        <div className="group/header sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background-secondary/95 py-2">
                          <h3 className="flex items-center gap-2 font-mono-accent text-sm font-bold uppercase tracking-wider text-text-secondary">
                            {group.category}
                            <Badge
                              variant="secondary"
                              className="h-5 min-w-[1.5rem] justify-center rounded-full border-0 bg-accent-info/10 px-2 font-mono-accent text-[10px] text-accent-info"
                            >
                              {group.comments.length}
                            </Badge>
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={isExpanded ? `Свернуть ${group.category}` : `Развернуть ${group.category}`}
                            className="size-8 p-0 text-text-secondary opacity-0 transition-opacity hover:bg-background-primary/40 hover:text-white group-hover/header:opacity-100"
                            onClick={() => toggleCategory(group.category)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </Button>
                        </div>

                        {isExpanded && (
                          <CommentsContainer>
                            {renderCommentsList(group.comments)}
                          </CommentsContainer>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {((!showKeywordComments && !showKeywordPosts) || !hasDefinedKeywords) &&
              hasCommentsWithoutKeywords && (
                <div className="space-y-2">
                  {hasKeywordGroups && (
                    <div className="sticky top-0 z-10 border-b-2 border-dashed border-border/40 bg-background-secondary/95 py-2">
                      <h3 className="font-mono-accent text-sm font-bold uppercase tracking-wider text-text-secondary/60">
                        Остальные комментарии
                      </h3>
                    </div>
                  )}

                  <CommentsContainer>
                    {renderCommentsList(filteredCommentsWithoutKeywords)}
                  </CommentsContainer>
                </div>
              )}

            <div
              role="button"
              tabIndex={hasMore ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && hasMore && !isLoadingMore) {
                  e.preventDefault()
                  onLoadMore()
                }
              }}
              className={`flex min-h-[40px] flex-col items-center gap-2 pt-4 text-center transition-opacity ${hasMore && !isLoadingMore ? 'cursor-pointer hover:opacity-70' : ''}`}
              onClick={() => {
                if (hasMore && !isLoadingMore) onLoadMore()
              }}
            >
              <p className="font-mono-accent text-xs text-text-secondary/70">
                Загружено {loadedCount} · Показано {renderedCount} · Всего{' '}
                {totalCount.toLocaleString('ru-RU')}{' '}
                {declOfNumber(totalCount, ['комментарий', 'комментария', 'комментариев'])}
              </p>

              <div ref={observerTargetRef} className="flex w-full justify-center py-2">
                {hasMore && isLoadingMore && (
                  <div className="flex items-center gap-2 font-mono-accent text-xs text-text-secondary">
                    <Spinner className="size-3.5" />
                    Загрузка...
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
})

export default CommentsTableCard
