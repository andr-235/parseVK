import { memo, useCallback, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { Badge } from '@/shared/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card'
import { LoadingState } from '@/shared/components/LoadingState'
import { EmptyState } from '@/shared/components/EmptyState'
import CommentCard from './CommentCard'
import { PostGroupCard } from './PostGroupCard'
import useCommentsTableCardController from '@/modules/comments/hooks/useCommentsTableCardController'
import type { CategorizedComment, CategorizedGroup } from '@/modules/comments/types/commentsTable'

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
  visibleCount: number
  showKeywordComments: boolean
  showKeywordPosts: boolean
  hasDefinedKeywords: boolean
  onAddToWatchlist?: (commentId: number) => void
  watchlistPending?: Record<number, boolean>
  keywordCommentsTotal: number
}

const getCommentLabel = (count: number) => {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'комментарий'
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'комментария'
  }

  return 'комментариев'
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
  visibleCount,
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
    subtitle,
  } = useCommentsTableCardController({
    groupedComments,
    commentsWithoutKeywords,
    isLoading,
    showKeywordComments,
    showKeywordPosts,
    hasDefinedKeywords,
    visibleCount,
  })

  const observerTargetRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  const hasMoreRef = useRef(hasMore)
  const isLoadingMoreRef = useRef(isLoadingMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
    hasMoreRef.current = hasMore
    isLoadingMoreRef.current = isLoadingMore
  }, [onLoadMore, hasMore, isLoadingMore])

  // После загрузки проверяем, находится ли target в viewport — если да, загружаем ещё
  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMore || !hasComments) return

    const target = observerTargetRef.current
    if (!target) return

    // Используем setTimeout чтобы дождаться рендера
    const timeoutId = setTimeout(() => {
      const rect = target.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight + 200

      if (isInViewport && hasMoreRef.current && !isLoadingMoreRef.current) {
        onLoadMoreRef.current()
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [isLoading, isLoadingMore, hasMore, hasComments])

  useEffect(() => {
    const target = observerTargetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          onLoadMoreRef.current()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasComments, hasMore])

  // Memoized render function (rerender optimization)
  const renderCommentsList = useCallback(
    (items: CategorizedComment[]) => {
      const postGroups = new Map<string, CategorizedComment[]>()
      const standaloneItems: CategorizedComment[] = []

      items.forEach((item) => {
        // Group by post if there are POST keyword matches and post data exists.
        // Grouping helps organize comments that share the same post context.
        const hasPostMatch = item.matchedKeywords.some((kw) => kw.source === 'POST')
        const hasPostData = item.comment.postText || item.comment.postGroup

        // Group by post only if showKeywordPosts filter is active
        // - If only showKeywordComments: don't group (show standalone comments)
        // - If showKeywordPosts (alone or with comments): group by posts
        const shouldGroupByPost = showKeywordPosts && hasPostMatch && hasPostData

        if (shouldGroupByPost) {
          // Create a unique key for the post
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
      toggleReadStatus,
      watchlistPending,
    ]
  )

  return (
    <Card className="border-0 bg-transparent shadow-none">
      {/* Header */}
      <CardHeader className="px-0 pb-6 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-monitoring-display text-xl font-semibold tracking-tight text-white">
              Лента комментариев
            </CardTitle>
            <CardDescription className="mt-1.5 font-monitoring-body text-slate-300">
              {subtitle}
              {keywordCommentsTotal > 0 && (
                <span className="ml-2 inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 font-mono-accent text-xs font-medium text-cyan-400">
                  {keywordCommentsTotal} с ключами
                </span>
              )}
            </CardDescription>
          </div>
          {/* Stats badge */}
          <div className="hidden items-center gap-2 sm:flex">
            {isLoading ? (
              <Spinner className="size-4 text-slate-400" />
            ) : (
              <Badge
                variant="secondary"
                className="border-white/10 bg-slate-800/50 font-mono-accent font-normal text-slate-300"
              >
                {visibleCount} / {totalCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-8">
        {isLoading && !hasComments && <LoadingState message="Загружаем комментарии…" useCard />}

        {!isLoading && !hasComments && (
          <EmptyState icon="💬" title="Нет данных" description={emptyMessage} />
        )}

        {hasComments && (
          <>
            {/* Группы с ключевыми словами */}
            {hasKeywordGroups && (
              <div className="space-y-6">
                {keywordGroups.map((group) => {
                  const isExpanded = expandedCategories[group.category] ?? true

                  return (
                    <div key={group.category} className="space-y-2">
                      {/* Category header (Sticky) */}
                      <div className="group/header sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
                        <h3 className="flex items-center gap-2 font-mono-accent text-sm font-bold uppercase tracking-wider text-slate-400">
                          {group.category}
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-[1.5rem] justify-center rounded-full border-0 bg-cyan-500/10 px-2 font-mono-accent text-[10px] text-cyan-400"
                          >
                            {group.comments.length}
                          </Badge>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-slate-400 opacity-0 transition-opacity hover:bg-white/5 hover:text-white group-hover/header:opacity-100"
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
                        <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/30 shadow-sm backdrop-blur-sm">
                          {renderCommentsList(group.comments)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Comments without keywords */}
            {((!showKeywordComments && !showKeywordPosts) || !hasDefinedKeywords) &&
              hasCommentsWithoutKeywords && (
                <div className="space-y-2">
                  {hasKeywordGroups && (
                    <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
                      <h3 className="font-mono-accent text-sm font-bold uppercase tracking-wider text-slate-400">
                        Остальные комментарии
                      </h3>
                    </div>
                  )}

                  <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/30 shadow-sm backdrop-blur-sm">
                    {renderCommentsList(commentsWithoutKeywords)}
                  </div>
                </div>
              )}

            {/* Auto-load */}
            <div
              className={`flex min-h-[60px] flex-col items-center gap-4 pt-4 text-center transition-opacity ${hasMore && !isLoadingMore ? 'cursor-pointer hover:opacity-70' : ''}`}
              onClick={() => {
                if (hasMore && !isLoadingMore) onLoadMore()
              }}
            >
              <p className="font-monitoring-body text-sm text-slate-400">
                Загружено {loadedCount} из {totalCount} {getCommentLabel(totalCount)}
              </p>

              <div ref={observerTargetRef} className="flex w-full justify-center py-4">
                {hasMore && isLoadingMore && (
                  <div className="flex items-center gap-2 font-monitoring-body text-sm text-slate-400">
                    <Spinner className="size-4" />
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
