import { ListingsHero } from '@/modules/listings/components/ListingsHero'
import { ListingsFilters } from '@/modules/listings/components/ListingsFilters'
import { ListingsInfinite } from '@/modules/listings/components/ListingsInfinite'
import ExportListingsModal from '@/modules/listings/components/ExportListingsModal'
import ImportListingsModal from '@/modules/listings/components/ImportListingsModal'
import EditListingModal from '@/modules/listings/components/EditListingModal'
import { useListingsViewModel } from '@/modules/listings/hooks/useListingsViewModel'

function ListingsPage() {
  const {
    pageSize,
    searchTerm,
    appliedSearch,
    sourceFilter,
    archivedFilter,
    expandedDescriptions,
    isListLoading,
    isExportOpen,
    isImportOpen,
    noteListing,
    querySource,
    fetchParams,
    filtersKey,
    fetchListingsBatch,
    filterOptions,
    summaryText,
    PAGE_SIZE_OPTIONS,
    setSearchTerm,
    setIsExportOpen,
    setIsImportOpen,
    handleApplySearch,
    handleResetSearch,
    handleSourceChange,
    handleArchivedChange,
    handlePageSizeChange,
    handleManualRefresh,
    toggleDescription,
    handleAddNote,
    handleCloseEdit,
    handleListingUpdated,
    handleArchive,
    handleMetaChange,
    handleItemsChange,
    handleLoadingChange,
  } = useListingsViewModel()

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <ListingsHero
          isListLoading={isListLoading}
          onImport={() => setIsImportOpen(true)}
          onExport={() => setIsExportOpen(true)}
          onRefresh={handleManualRefresh}
        />
      </div>

      {/* Filters Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <ListingsFilters
          searchTerm={searchTerm}
          appliedSearch={appliedSearch}
          sourceFilter={sourceFilter}
          archivedFilter={archivedFilter}
          pageSize={pageSize}
          filterOptions={filterOptions}
          PAGE_SIZE_OPTIONS={PAGE_SIZE_OPTIONS}
          summaryText={summaryText}
          onSearchChange={setSearchTerm}
          onApplySearch={handleApplySearch}
          onResetSearch={handleResetSearch}
          onSourceChange={handleSourceChange}
          onArchivedChange={handleArchivedChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Listings Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <ListingsInfinite
          fetcher={fetchListingsBatch}
          limit={pageSize}
          filtersKey={filtersKey}
          fetchParams={fetchParams}
          expandedDescriptions={expandedDescriptions}
          onToggleDescription={toggleDescription}
          onAddNote={handleAddNote}
          onArchive={handleArchive}
          onMetaChange={handleMetaChange}
          onItemsChange={handleItemsChange}
          onLoadingChange={handleLoadingChange}
        />
      </div>

      <EditListingModal
        listing={noteListing}
        isOpen={Boolean(noteListing)}
        onClose={handleCloseEdit}
        onUpdated={handleListingUpdated}
      />

      <ExportListingsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultSearch={appliedSearch}
        defaultSource={querySource}
      />

      <ImportListingsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleManualRefresh}
      />
    </div>
  )
}

export default ListingsPage
