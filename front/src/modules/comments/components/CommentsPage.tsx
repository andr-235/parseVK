import CommentsHero from '@/modules/comments/components/CommentsHero'
import CommentsFiltersPanel from '@/modules/comments/components/CommentsFiltersPanel'
import CommentsTableCard from '@/modules/comments/components/CommentsTableCard'
import useCommentsViewModel from '@/modules/comments/hooks/useCommentsViewModel'

function CommentsPage() {
  const {
    totalCount,
    readCount,
    unreadCount,
    searchTerm,
    handleSearchChange,
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
    visibleCount,
    hasDefinedKeywords,
    handleAddToWatchlist,
    watchlistPending,
    keywordCommentsTotal,
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
          visibleCount={visibleCount}
          showKeywordComments={showKeywordComments}
          showKeywordPosts={showKeywordPosts}
          hasDefinedKeywords={hasDefinedKeywords}
          onAddToWatchlist={handleAddToWatchlist}
          watchlistPending={watchlistPending}
          keywordCommentsTotal={keywordCommentsTotal}
        />
      </div>
    </div>
  )
}

export default CommentsPage
