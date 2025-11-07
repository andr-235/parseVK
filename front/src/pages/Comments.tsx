import CommentsFiltersPanel from './Comments/components/CommentsFiltersPanel'
import CommentsTableCard from './Comments/components/CommentsTableCard'
import CommentsHero from './Comments/components/CommentsHero'
import useCommentsViewModel from './Comments/hooks/useCommentsViewModel'
import { Separator } from '@/components/ui/separator'

function Comments() {
  const {
    totalCount,
    readCount,
    unreadCount,
    searchTerm,
    handleSearchChange,
    showOnlyKeywordComments,
    handleToggleKeywords,
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
        showOnlyKeywordComments={showOnlyKeywordComments}
        onToggleKeywords={handleToggleKeywords}
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
        showOnlyKeywordComments={showOnlyKeywordComments}
        hasDefinedKeywords={hasDefinedKeywords}
        onAddToWatchlist={handleAddToWatchlist}
        watchlistPending={watchlistPending}
        keywordCommentsTotal={keywordCommentsTotal}
      />
    </div>
  )
}

export default Comments
