import { useWatchlistAuthors } from '@/hooks/useWatchlistAuthors'
import { useWatchlistSettings } from '@/hooks/useWatchlistSettings'
import { useAuthorColumns } from './Watchlist/components/authorColumns'
import { useCommentColumns } from './Watchlist/components/commentColumns'
import { WatchlistHero } from './Watchlist/components/WatchlistHero'
import { WatchlistAuthorsTable } from './Watchlist/components/WatchlistAuthorsTable'
import { WatchlistAuthorDetails } from './Watchlist/components/WatchlistAuthorDetails'

function Watchlist() {
  const {
    authors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    currentAuthor,
    isLoadingAuthorDetails,
    pendingRemoval,
    handleRefresh,
    handleLoadMore,
    handleRemoveFromWatchlist,
    handleSelectAuthor,
  } = useWatchlistAuthors()

  const {
    settings,
    isUpdatingSettings,
    handleToggleTrackAll,
  } = useWatchlistSettings()

  const authorColumns = useAuthorColumns({
    handleSelectAuthor,
    handleRemoveFromWatchlist,
    pendingRemoval,
  })

  const commentColumns = useCommentColumns()

  return (
    <div className="flex flex-col gap-8">
      <WatchlistHero
        settings={settings}
        totalAuthors={totalAuthors}
        isLoadingAuthors={isLoadingAuthors}
        isUpdatingSettings={isUpdatingSettings}
        onRefresh={handleRefresh}
        onToggleTrackAll={handleToggleTrackAll}
      />

      <WatchlistAuthorsTable
        authors={authors}
        totalAuthors={totalAuthors}
        hasMoreAuthors={hasMoreAuthors}
        isLoadingAuthors={isLoadingAuthors}
        isLoadingMoreAuthors={isLoadingMoreAuthors}
        authorColumns={authorColumns}
        onSelectAuthor={handleSelectAuthor}
        onLoadMore={handleLoadMore}
      />

      <WatchlistAuthorDetails
        currentAuthor={currentAuthor}
        isLoadingAuthorDetails={isLoadingAuthorDetails}
        commentColumns={commentColumns}
      />
    </div>
  )
}

export default Watchlist
