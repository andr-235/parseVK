import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import LoadingCommentsState from './LoadingCommentsState'
import EmptyCommentsState from './EmptyCommentsState'
import CommentCard from './CommentCard'
import { ChevronDown, ChevronUp } from 'lucide-react'
import useCommentsTableCardController from '../hooks/useCommentsTableCardController'
import type { CategorizedComment, CategorizedGroup } from '../types/commentsTable'
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
    loadedSuffix,
  } = useCommentsTableCardController({
    groupedComments,
    commentsWithoutKeywords,
    isLoading,
    showKeywordComments,
    showKeywordPosts,
    hasDefinedKeywords,
    totalCount,
    loadedCount,
    visibleCount,
  })

  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  return (
    <Card className="border-0 shadow-none bg-transparent">
       {/* Header - simplified */}
       <CardHeader className="px-0 pt-0 pb-6">
          <div className="flex items-center justify-between">
             <div>
                <CardTitle className="text-xl font-semibold tracking-tight">Лента комментариев</CardTitle>
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
        {isLoading && !hasComments && <LoadingCommentsState />}

        {!isLoading && !hasComments && <EmptyCommentsState message={emptyMessage} />}

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
                             <Badge variant="secondary" className="rounded-full px-2 h-5 text-[10px] min-w-[1.5rem] justify-center">
                                {group.comments.length}
                             </Badge>
                          </h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground opacity-0 group-hover/header:opacity-100 transition-opacity"
                            onClick={() => toggleCategory(group.category)}
                          >
                             {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                       </div>

                      {isExpanded && (
                        <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden divide-y divide-border/40">
                          {group.comments.map(({ comment, matchedKeywords }) => {
                            const commentIndex = commentIndexMap.get(comment.id) ?? 0
                            return (
                              <CommentCard
                                key={`${group.category}-${comment.id}-${commentIndex}`}
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
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Комментарии без ключевых слов */}
            {(!showKeywordComments && !showKeywordPosts || !hasDefinedKeywords) && hasCommentsWithoutKeywords && (
               <div className="space-y-2">
                 {hasKeywordGroups && (
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b border-border/40">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                           Остальные комментарии
                        </h3>
                    </div>
                 )}
                 
                 <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden divide-y divide-border/40">
                    {commentsWithoutKeywords.map(({ comment, matchedKeywords }) => {
                      const commentIndex = commentIndexMap.get(comment.id) ?? 0
                      return (
                        <CommentCard
                          key={`without-keywords-${comment.id}-${commentIndex}`}
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
                 </div>
              </div>
            )}

            {/* Автоподгрузка */}
            <div className="flex flex-col gap-4 pt-4 items-center text-center min-h-[60px]">
               <p className="text-sm text-muted-foreground">
                Загружено {loadedCount} из {totalCount} {getCommentLabel(totalCount)}
                {loadedSuffix}
              </p>
              
              {hasMore && (
                <div ref={observerTarget} className="w-full flex justify-center py-4">
                  {(isLoadingMore) && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Spinner className="h-4 w-4" />
                       Загрузка...
                     </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CommentsTableCard