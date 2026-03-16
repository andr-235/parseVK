import CommentsHero from '@/modules/comments/components/CommentsHero'
import CommentsFiltersPanel from '@/modules/comments/components/CommentsFiltersPanel'
import CommentsSearchResults from '@/modules/comments/components/CommentsSearchResults'
import CommentsTableCard from '@/modules/comments/components/CommentsTableCard'
import useCommentsViewModel from '@/modules/comments/hooks/useCommentsViewModel'

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
    <div className="flex flex-col gap-8 pb-10 pt-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <CommentsHero totalCount={totalCount} readCount={readCount} unreadCount={unreadCount} />
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
