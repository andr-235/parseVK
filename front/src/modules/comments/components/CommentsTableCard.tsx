import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import CommentCard from './CommentCard'
import { PostGroupCard } from './PostGroupCard'
import { ChevronDown, ChevronUp } from 'lucide-react'
import useCommentsTableCardController from '@/modules/comments/hooks/useCommentsTableCardController'
import type { CategorizedComment, CategorizedGroup } from '@/modules/comments/types/commentsTable'
import { useEffect, useRef } from 'react'

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

function CommentsTableCard({
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

  const renderCommentsList = (items: CategorizedComment[]) => {
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
          (item.comment.postText || '') + (item.comment.postGroup?.id || item.comment.id.toString())
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
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      {/* Header - simplified */}
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Лента комментариев
            </CardTitle>
            <CardDescription className="mt-1.5">
              {subtitle}
              {keywordCommentsTotal > 0 && (
                <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  {keywordCommentsTotal} с ключами
                </span>
              )}
            </CardDescription>
          </div>
          {/* Stats badge */}
          <div className="hidden sm:flex items-center gap-2">
            {isLoading ? (
              <Spinner className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Badge variant="secondary" className="font-mono font-normal">
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
                      {/* Заголовок категории (Sticky like header) */}
                      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b border-border/40 flex items-center justify-between group/header">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          {group.category}
                          <Badge
                            variant="secondary"
                            className="rounded-full px-2 h-5 text-[10px] min-w-[1.5rem] justify-center"
                          >
                            {group.comments.length}
                          </Badge>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground opacity-0 group-hover/header:opacity-100 transition-opacity"
                          onClick={() => toggleCategory(group.category)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden divide-y divide-border/40">
                          {renderCommentsList(group.comments)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Комментарии без ключевых слов */}
            {((!showKeywordComments && !showKeywordPosts) || !hasDefinedKeywords) &&
              hasCommentsWithoutKeywords && (
                <div className="space-y-2">
                  {hasKeywordGroups && (
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b border-border/40">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Остальные комментарии
                      </h3>
                    </div>
                  )}

                  <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden divide-y divide-border/40">
                    {renderCommentsList(commentsWithoutKeywords)}
                  </div>
                </div>
              )}

            {/* Автоподгрузка */}
            <div
              className={`flex flex-col gap-4 pt-4 items-center text-center min-h-[60px] transition-opacity ${hasMore && !isLoadingMore ? 'cursor-pointer hover:opacity-70' : ''}`}
              onClick={() => {
                if (hasMore && !isLoadingMore) onLoadMore()
              }}
            >
              <p className="text-sm text-muted-foreground">
                Загружено {loadedCount} из {totalCount} {getCommentLabel(totalCount)}
              </p>

              <div ref={observerTargetRef} className="w-full flex justify-center py-4">
                {hasMore && isLoadingMore && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
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
}

export default CommentsTableCard
