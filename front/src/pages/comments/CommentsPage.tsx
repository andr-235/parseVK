import { useMemo, Fragment } from 'react'
import { PageHeader, PageContainer } from '@/shared/components/common'
import { Search } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/utils'
import CommentsSearchResults from '@/pages/comments/components/CommentsSearchResults'
import CommentsTableCard from '@/pages/comments/components/CommentsTableCard'
import useCommentsViewModel from '@/pages/comments/hooks/useCommentsViewModel'
import { useCommentsKeyboardNav } from '@/pages/comments/hooks/useCommentsKeyboardNav'

const TABS = [
  { key: 'review' as const, label: 'На проверку' },
  { key: 'watchlist' as const, label: 'На карандаше' },
  { key: 'all' as const, label: 'Все записи' },
] as const

function CommentsPage() {
  const {
    searchTerm,
    handleSearchChange,
    tabMode,
    handleTabChange,
    filterMode,
    handleFilterChange,
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
    totalCount,
    handleAddToWatchlist,
    watchlistPending,
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
      />

      {/* Search bar */}
      <div className="relative mb-4 w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Поиск по тексту, автору или ID..."
          aria-label="Поиск по комментариям"
          className="h-10 w-full rounded-xl border-border bg-background-primary pl-10 text-text-light placeholder:text-text-secondary focus-visible:ring-1 focus-visible:ring-accent-primary/30"
        />
      </div>

      {/* Tabs row */}
      <div className="mb-3 flex items-center gap-5 border-b border-border/40" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tabMode === tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'border-b-2 px-1 pb-2 font-mono-accent text-xs font-medium transition-[color,border-color] duration-200',
              tabMode === tab.key
                ? 'border-accent-primary text-text-light'
                : 'border-transparent text-text-secondary hover:text-text-light'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Keyword source pills */}
      <div className="mb-4 flex items-center gap-3">
        {(['all', 'comments', 'posts'] as const).map((mode) => (
            <Fragment key={mode}>
            {mode !== 'all' && <span className="text-text-secondary/30">·</span>}
            <button
              type="button"
              onClick={() => handleFilterChange(mode)}
              className={cn(
                'font-mono-accent text-xs transition-[color] duration-200',
                filterMode === mode ? 'text-text-light' : 'text-text-secondary hover:text-text-light'
              )}
            >
              {mode === 'all' ? 'Все совпадения' : mode === 'comments' ? 'В комментариях' : 'В постах'}
            </button>
          </Fragment>
        ))}
      </div>

      {/* Content area */}
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
          onAddToWatchlist={handleAddToWatchlist}
          watchlistPending={watchlistPending}
        />
      )}
    </PageContainer>
  )
}

export default CommentsPage
