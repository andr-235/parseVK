import { useMemo } from 'react'
import { PageHeader, FiltersPanel, PageContainer } from '@/shared/components/common'
import { MessageSquare, Eye, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils'
import CommentsSearchResults from '@/pages/comments/components/CommentsSearchResults'
import CommentsTableCard from '@/pages/comments/components/CommentsTableCard'
import useCommentsViewModel from '@/pages/comments/hooks/useCommentsViewModel'
import { useCommentsKeyboardNav } from '@/pages/comments/hooks/useCommentsKeyboardNav'

function CommentsPage() {
  const {
    totalCount,
    readCount,
    unreadCount,
    searchTerm,
    handleSearchChange,
    viewMode,
    handleViewModeChange,
    showKeywordComments,
    handleToggleKeywordComments,
    showKeywordPosts,
    handleToggleKeywordPosts,
    readFilter,
    handleReadFilterChange,
    keywordsCount,
    groupedComments,
    commentsWithoutKeywords,
    commentIndexMap,
    isLoading,
    emptyMessage,
    toggleReadStatus,
    handleLoadMore,
    hasMore,
    isLoadingMore,
    loadedCount,
    renderedCount,
    hasDefinedKeywords,
    handleAddToWatchlist,
    watchlistPending,
    keywordCommentsTotal,
    useSearchResults,
    searchResults,
  } = useCommentsViewModel()

  const allCommentIds = useMemo(() => {
    const ids: number[] = []
    groupedComments.forEach((g) => g.comments.forEach((c) => ids.push(c.comment.id)))
    commentsWithoutKeywords.forEach((c) => ids.push(c.comment.id))
    return ids
  }, [groupedComments, commentsWithoutKeywords])

  useCommentsKeyboardNav({
    commentIds: useSearchResults ? [] : allCommentIds,
    onMarkRead: toggleReadStatus,
    onAddToWatchlist: handleAddToWatchlist,
  })

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <PageHeader
        title={
          <>
            VK <span className="text-accent-primary">Комментарии</span>
          </>
        }
        description="Управляйте обратной связью из сообществ и отслеживайте важные сообщения в реальном времени."
          badges={[
            {
              icon: MessageSquare,
              value: totalCount.toLocaleString('ru-RU'),
              label: 'всего',
              className: 'border-border/40 bg-background-secondary/50 text-text-secondary',
            },
            {
              icon: Eye,
              value: unreadCount.toLocaleString('ru-RU'),
              label: 'непрочитано',
              className: 'border-border/40 bg-background-secondary/50 text-text-secondary',
            },
            {
              icon: CheckCircle2,
              value: readCount.toLocaleString('ru-RU'),
              label: 'прочитано',
              className: 'border-border/40 bg-background-secondary/50 text-text-secondary',
            },
          ]}
      />

      <FiltersPanel
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Поиск по тексту, автору или ID..."
        >
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg bg-background-primary p-1 border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange('comments')}
              className={cn(
                'h-7 rounded-md px-3 text-xs font-medium transition-all',
                viewMode === 'comments'
                  ? 'bg-background-secondary shadow-sm text-text-light'
                  : 'text-text-secondary hover:text-text-light'
              )}
            >
              Комментарии
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange('posts')}
              className={cn(
                'h-7 rounded-md px-3 text-xs font-medium transition-all',
                viewMode === 'posts'
                  ? 'bg-background-secondary shadow-sm text-text-light'
                  : 'text-text-secondary hover:text-text-light'
              )}
            >
              Посты
            </Button>
          </div>

          {/* Read status filter */}
          <div className="flex items-center rounded-lg bg-background-primary p-1 border border-border">
            {(['all', 'unread', 'read'] as const).map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                onClick={() => handleReadFilterChange(filter)}
                className={cn(
                  'h-7 rounded-md px-3 text-xs font-medium transition-all',
                  readFilter === filter
                    ? 'bg-background-secondary shadow-sm text-text-light'
                    : 'text-text-secondary hover:text-text-light'
                )}
              >
                {filter === 'all' ? 'Все' : filter === 'unread' ? 'Непрочитанные' : 'Прочитанные'}
              </Button>
            ))}
          </div>

          {/* Keyword filters */}
          {keywordsCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleKeywordComments(!showKeywordComments)}
                className={cn(
                  'h-8 rounded-lg border px-3 text-xs font-medium transition-all',
                   showKeywordComments
                    ? 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary'
                    : 'border-border bg-transparent text-text-secondary hover:text-text-light'
                )}
              >
                В комментариях
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleKeywordPosts(!showKeywordPosts)}
                className={cn(
                  'h-8 rounded-lg border px-3 text-xs font-medium transition-all',
                   showKeywordPosts
                    ? 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary'
                    : 'border-border bg-transparent text-text-secondary hover:text-text-light'
                )}
              >
                В постах
              </Button>
              <Badge className="border border-border bg-background-primary px-2 py-1 font-mono-accent text-[10px] text-text-secondary">
                {keywordsCount} ключей
              </Badge>
            </div>
          )}
        </FiltersPanel>

      {useSearchResults ? (
        <CommentsSearchResults result={searchResults} isLoading={isLoading} />
      ) : (
        <CommentsTableCard
          groupedComments={groupedComments}
          commentsWithoutKeywords={commentsWithoutKeywords}
          commentIndexMap={commentIndexMap}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          toggleReadStatus={toggleReadStatus}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
          renderedCount={renderedCount}
          showKeywordComments={showKeywordComments}
          showKeywordPosts={showKeywordPosts}
          hasDefinedKeywords={hasDefinedKeywords}
          onAddToWatchlist={handleAddToWatchlist}
          watchlistPending={watchlistPending}
          keywordCommentsTotal={keywordCommentsTotal}
        />
      )}
    </PageContainer>
  )
}

export default CommentsPage
