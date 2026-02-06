import { AuthorsHero } from '@/modules/authors/components/AuthorsHero'
import { AuthorsFiltersPanel } from '@/modules/authors/components/AuthorsFiltersPanel'
import { AuthorsTableCard } from '@/modules/authors/components/AuthorsTableCard'
import { useAuthorsViewModel } from '@/modules/authors/hooks/useAuthorsViewModel'

function AuthorsPage() {
  const {
    authors,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    searchValue,
    statusFilter,
    cityValue,
    cityOptions,
    sortBy,
    sortOrder,
    analyzingVkUserId,
    isAnalyzing,
    emptyTitle,
    emptyDescription,
    handleSearchChange,
    handleStatusFilterChange,
    handleCityFilterChange,
    handleLoadMore,
    handleRefresh,
    handleOpenDetails,
    handleAnalyzePhotos,
    handleDeleteAuthor,
    deletingVkUserId,
    handleVerifyAuthor,
    handleSortChange,
  } = useAuthorsViewModel()

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <AuthorsHero
          totalAuthors={authors.length}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Filters Panel - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Фильтры</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <AuthorsFiltersPanel
          searchTerm={searchValue}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          cityFilter={cityValue}
          onCityFilterChange={handleCityFilterChange}
          cityOptions={cityOptions}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing || isLoading}
        />
      </div>

      {/* Authors Table - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            База авторов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <AuthorsTableCard
          authors={authors}
          isLoading={isLoading}
          sortBy={sortBy ?? 'fullName'}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onOpenDetails={handleOpenDetails}
          onAnalyzePhotos={handleAnalyzePhotos}
          onDeleteAuthor={handleDeleteAuthor}
          onVerifyAuthor={handleVerifyAuthor}
          deletingVkUserId={deletingVkUserId}
          analyzingVkUserId={analyzingVkUserId}
          isAnalyzing={isAnalyzing}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
    </div>
  )
}

export default AuthorsPage
