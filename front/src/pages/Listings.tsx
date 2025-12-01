import { ListingsHero } from './Listings/components/ListingsHero'
import { ListingsFilters } from './Listings/components/ListingsFilters'
import { ListingsInfinite } from './Listings/components/ListingsInfinite'
import ExportListingsModal from './Listings/components/ExportListingsModal'
import ImportListingsModal from './Listings/components/ImportListingsModal'
import EditListingModal from './Listings/components/EditListingModal'
import { useListingsViewModel } from './Listings/hooks/useListingsViewModel'

function Listings() {
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
    <div className="flex flex-col gap-8 pb-10 pt-6">
      <ListingsHero
        isListLoading={isListLoading}
        onImport={() => setIsImportOpen(true)}
        onExport={() => setIsExportOpen(true)}
        onRefresh={handleManualRefresh}
      />

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

export default Listings
