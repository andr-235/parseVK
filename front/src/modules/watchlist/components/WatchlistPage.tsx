import { useWatchlistViewModel } from '@/modules/watchlist/hooks/useWatchlistViewModel'
import { WatchlistTableCard } from '@/modules/watchlist/components/WatchlistTableCard'
import { WatchlistAuthorDetails } from '@/modules/watchlist/components/WatchlistAuthorDetails'
import { WatchlistHero } from '@/modules/watchlist/components/WatchlistHero'

function WatchlistPage() {
  const {
    filteredAuthors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    currentAuthor,
    isLoadingAuthorDetails,
    settings,
    isUpdatingSettings,
    searchTerm,
    setSearchTerm,
    authorColumns,
    commentColumns,
    handleRefresh,
    handleLoadMore,
    handleToggleTrackAll,
    handleSelectAuthor,
  } = useWatchlistViewModel()

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <WatchlistHero
          settings={settings}
          totalAuthors={totalAuthors}
          isLoadingAuthors={isLoadingAuthors}
          isUpdatingSettings={isUpdatingSettings}
          onRefresh={handleRefresh}
          onToggleTrackAll={handleToggleTrackAll}
        />
      </div>

      {/* Watchlist Table - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Список авторов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <WatchlistTableCard
          authors={filteredAuthors}
          totalAuthors={totalAuthors}
          hasMoreAuthors={hasMoreAuthors}
          isLoadingAuthors={isLoadingAuthors}
          isLoadingMoreAuthors={isLoadingMoreAuthors}
          authorColumns={authorColumns}
          onSelectAuthor={handleSelectAuthor}
          onLoadMore={handleLoadMore}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Author Details - staggered animation */}
      {currentAuthor && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
          <WatchlistAuthorDetails
            currentAuthor={currentAuthor}
            isLoadingAuthorDetails={isLoadingAuthorDetails}
            commentColumns={commentColumns}
          />
        </div>
      )}
    </div>
  )
}

export default WatchlistPage
