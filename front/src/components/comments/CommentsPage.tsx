import { PageHeader } from '@/components/common'
import { MessageSquare, Eye, CheckCircle2 } from 'lucide-react'
import CommentsFiltersPanel from '@/components/comments/CommentsFiltersPanel'
import CommentsSearchResults from '@/components/comments/CommentsSearchResults'
import CommentsTableCard from '@/components/comments/CommentsTableCard'
import useCommentsViewModel from '@/hooks/comments/useCommentsViewModel'

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
    <div className="flex flex-col gap-8 pb-10 pt-6 font-monitoring-body max-w-[1600px] mx-auto w-full">
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
              className: 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary'
            },
            {
              icon: Eye,
              value: unreadCount.toLocaleString('ru-RU'),
              label: 'непрочитано',
              className: 'hover:border-accent-primary/50 hover:bg-background-secondary/85'
            },
            {
              icon: CheckCircle2,
              value: readCount.toLocaleString('ru-RU'),
              label: 'прочитано',
              className: 'hover:border-accent-success/30 [&>svg]:text-accent-success/70'
            }
          ]}
        />
      </div>

      {/* Filters Panel - staggered animation */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <CommentsFiltersPanel
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showKeywordComments={showKeywordComments}
          onToggleKeywordComments={handleToggleKeywordComments}
          showKeywordPosts={showKeywordPosts}
          onToggleKeywordPosts={handleToggleKeywordPosts}
          readFilter={readFilter}
          onReadFilterChange={handleReadFilterChange}
          keywordsCount={keywordsCount}
        />
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
    </div>
  )
}

export default CommentsPage
