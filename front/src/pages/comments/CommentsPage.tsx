import { PageHeader, FiltersPanel, PageContainer } from '@/components/common'
import { MessageSquare, Eye, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/shared/utils'
import CommentsSearchResults from '@/pages/comments/components/CommentsSearchResults'
import CommentsTableCard from '@/pages/comments/components/CommentsTableCard'
import useCommentsViewModel from '@/pages/comments/hooks/useCommentsViewModel'

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

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 px-4 md:px-8">
        <PageHeader
          variant="badges"
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
              className: 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary',
            },
            {
              icon: Eye,
              value: unreadCount.toLocaleString('ru-RU'),
              label: 'непрочитано',
              className: 'hover:border-accent-primary/50 hover:bg-background-secondary/85',
            },
            {
              icon: CheckCircle2,
              value: readCount.toLocaleString('ru-RU'),
              label: 'прочитано',
              className: 'hover:border-accent-success/30 [&>svg]:text-accent-success/70',
            },
          ]}
        />
      </div>

      {/* Filters Panel - staggered animation */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100 px-4 md:px-8">
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
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
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
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
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
      </div>

      {/* Comments Table - staggered animation */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
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
      </div>
    </PageContainer>
  )
}

export default CommentsPage
