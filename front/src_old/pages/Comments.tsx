import { Separator } from '@/components/ui/separator'
import CommentsHero from '@/features/comments/ui/CommentsHero'
import CommentsFiltersPanel from '@/features/comments/ui/CommentsFiltersPanel'
import CommentsTableCard from '@/features/comments/ui/CommentsTableCard'
import useCommentsViewModel from '@/features/comments/model/useCommentsViewModel'

function Comments() {
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
    <div className="flex flex-col gap-8">
      <CommentsHero totalCount={totalCount} readCount={readCount} unreadCount={unreadCount} />
      <Separator className="opacity-40" />
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
  )
}

export default Comments
