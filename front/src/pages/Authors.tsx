import PageHeroCard from '@/components/PageHeroCard'
import { AuthorsFiltersPanel } from '@/modules/authors/components/AuthorsFiltersPanel'
import { AuthorsTableCard } from '@/modules/authors/components/AuthorsTableCard'
import { useAuthorsViewModel } from '@/modules/authors/hooks/useAuthorsViewModel'

function Authors() {
  const {
    authors,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    searchValue,
    statusFilter,
    sortBy,
    sortOrder,
    analyzingVkUserId,
    isAnalyzing,
    emptyTitle,
    emptyDescription,
    handleSearchChange,
    handleStatusFilterChange,
    handleLoadMore,
    handleRefresh,
    handleOpenDetails,
    handleAnalyzePhotos,
    handleSortChange,
  } = useAuthorsViewModel()

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeroCard
        title="Авторы ВКонтакте"
        description="База авторов, собранная через парсинг и мониторинг. Управляйте статусами проверки и анализируйте профили."
        className="mb-2"
      />

      <div className="flex flex-col gap-6">
        <AuthorsFiltersPanel
          searchTerm={searchValue}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing || isLoading}
        />

        <AuthorsTableCard
          authors={authors}
          isLoading={isLoading}
          sortBy={sortBy ?? 'fullName'}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onOpenDetails={handleOpenDetails}
          onAnalyzePhotos={handleAnalyzePhotos}
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

export default Authors
