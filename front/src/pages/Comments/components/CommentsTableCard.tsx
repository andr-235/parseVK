import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import type { Comment, Keyword } from '@/types'
import LoadingCommentsState from './LoadingCommentsState'
import EmptyCommentsState from './EmptyCommentsState'
import CommentCard from './CommentCard'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CategorizedComment {
  comment: Comment
  matchedKeywords: Keyword[]
}

interface CategorizedGroup {
  category: string
  comments: CategorizedComment[]
}

interface CommentsTableCardProps {
  groupedComments: CategorizedGroup[]
  commentsWithoutKeywords: Comment[]
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
  showOnlyKeywordComments: boolean
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

const getCategoryLabel = (count: number) => {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'категория'
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'категории'
  }

  return 'категорий'
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
  showOnlyKeywordComments,
  hasDefinedKeywords,
  onAddToWatchlist,
  watchlistPending,
  keywordCommentsTotal,
}: CommentsTableCardProps) {
  const hasComments = visibleCount > 0
  const totalAvailable = Math.max(totalCount, loadedCount)
  const keywordGroups = useMemo(
    () => groupedComments.filter((group) => group.comments.length > 0),
    [groupedComments],
  )
  const hasKeywordGroups = keywordGroups.length > 0
  const hasCommentsWithoutKeywords = commentsWithoutKeywords.length > 0
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpandedCategories((previous) => {
      const next: Record<string, boolean> = {}
      let changed = false

      keywordGroups.forEach((group) => {
        const prevValue = previous[group.category]
        if (prevValue === undefined) {
          changed = true
        }
        next[group.category] = prevValue ?? true
      })

      if (!changed) {
        const prevKeys = Object.keys(previous)
        if (prevKeys.length !== keywordGroups.length) {
          changed = true
        } else {
          for (const key of prevKeys) {
            if (!(key in next)) {
              changed = true
              break
            }
          }
        }
      }

      return changed ? next : previous
    })
  }, [keywordGroups])

  const toggleCategory = (category: string) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [category]: !(previous[category] ?? true),
    }))
  }

  const keywordCommentCount = keywordCommentsTotal
  const totalCategories = keywordGroups.length
  const loadedSuffix =
    totalAvailable > 0 ? ` из ${totalAvailable}` : ''

  const subtitle = useMemo(() => {
    if (isLoading && !hasComments) {
      return 'Мы подготавливаем данные и проверяем их перед отображением.'
    }

    if (hasKeywordGroups) {
      return 'Комментарии с ключевыми словами сгруппированы по категориям. Используйте фильтры, чтобы сосредоточиться на нужных темах.'
    }

    if (hasCommentsWithoutKeywords && !hasDefinedKeywords) {
      return 'Ключевые слова пока не заданы — все найденные комментарии находятся в разделе «Без ключевых слов».'
    }

    if (hasComments && !showOnlyKeywordComments && hasCommentsWithoutKeywords) {
      return 'Комментарии без совпадений с ключевыми словами отображаются в отдельном блоке.'
    }

    return 'После добавления групп и запуска парсинга комментарии появятся в списке.'
  }, [hasComments, hasCommentsWithoutKeywords, hasDefinedKeywords, hasKeywordGroups, isLoading, showOnlyKeywordComments])

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
        <div className="flex min-w-[220px] flex-col items-end gap-3">
          {isLoading ? (
            <Badge variant="secondary" className="bg-[rgba(241,196,15,0.18)] text-[#f1c40f] dark:text-[#f9e79f]">
              Загрузка…
            </Badge>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="bg-[rgba(52,152,219,0.12)] text-[#3498db] dark:text-[#5dade2]">
                {keywordCommentCount} {getCommentLabel(keywordCommentCount)} с ключевыми словами
              </Badge>
              <Badge variant="outline" className="border-dashed border-border/60 text-text-secondary">
                {totalCategories} {getCategoryLabel(totalCategories)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-8 md:pb-8">
        {isLoading && !hasComments && <LoadingCommentsState />}

        {!isLoading && !hasComments && <EmptyCommentsState message={emptyMessage} />}

        {hasComments && (
          <div className="flex flex-col gap-6">
            {hasKeywordGroups && (
              <div className="flex flex-col gap-4">
                {keywordGroups.map((group) => {
                  const isExpanded = expandedCategories[group.category] ?? true

                  return (
                    <section
                      key={group.category}
                      className={`rounded-3xl border bg-background p-5 transition-colors ${isExpanded ? 'border-primary/70 shadow-lg shadow-primary/10' : 'border-border/60 hover:border-primary/60'}`}
                    >
                      <header className="pb-4">
                        <button
                          type="button"
                          onClick={() => toggleCategory(group.category)}
                          aria-expanded={isExpanded}
                          className="flex w-full items-center justify-between gap-4 text-left"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-lg font-semibold text-text-primary">{group.category}</span>
                            <span className="text-sm text-text-secondary">
                              {group.comments.length} {getCommentLabel(group.comments.length)}
                            </span>
                          </div>
                          <span className="text-text-secondary">
                            {isExpanded ? <ChevronUp className="size-5" aria-hidden /> : <ChevronDown className="size-5" aria-hidden />}
                          </span>
                        </button>
                      </header>

                      {isExpanded && (
                        <div className="flex flex-col gap-4">
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
                              />
                            )
                          })}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            )}

            {(!showOnlyKeywordComments || !hasDefinedKeywords) && hasCommentsWithoutKeywords && (
              <div className="flex flex-col gap-4">
                <section className="rounded-3xl border border-border/60 bg-background p-5">
                  <header className="flex flex-col gap-2 pb-4">
                    <h3 className="text-lg font-semibold text-text-primary">Без ключевых слов</h3>
                    <p className="text-sm text-text-secondary">
                      {commentsWithoutKeywords.length} {getCommentLabel(commentsWithoutKeywords.length)}
                    </p>
                  </header>
                  <div className="flex flex-col gap-4">
                    {commentsWithoutKeywords.map((comment) => {
                      const commentIndex = commentIndexMap.get(comment.id) ?? 0

                      return (
                        <CommentCard
                          key={`without-keywords-${comment.id}-${commentIndex}`}
                          comment={comment}
                          index={commentIndex}
                          matchedKeywords={[]}
                          toggleReadStatus={toggleReadStatus}
                          onAddToWatchlist={onAddToWatchlist}
                          isWatchlistLoading={Boolean(watchlistPending?.[comment.id])}
                        />
                      )
                    })}
                  </div>
                </section>
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">
                Отображается {visibleCount} {getCommentLabel(visibleCount)}. Загружено {loadedCount} {getCommentLabel(loadedCount)}
                {loadedSuffix}.
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
