import { ListingsHero } from '@/components/listings/ListingsHero'
import { ListingsFilters } from '@/components/listings/ListingsFilters'
import { ListingsInfinite } from '@/components/listings/ListingsInfinite'
import ExportListingsModal from '@/components/listings/ExportListingsModal'
import ImportListingsModal from '@/components/listings/ImportListingsModal'
import EditListingModal from '@/components/listings/EditListingModal'
import CreateListingModal from '@/components/listings/CreateListingModal'
import { FullEditListingModal } from '@/components/listings/FullEditListingModal'
import { useListingsViewModel } from '@/hooks/listings/useListingsViewModel'

function ListingsPage() {
  const {
    pageSize,
    searchTerm,
    appliedSearch,
    sourceFilter,
    archivedFilter,
    isListLoading,
    isExportOpen,
    isImportOpen,
    isCreateOpen,
    noteListing,
    editListing,
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
    setIsCreateOpen,
    handleApplySearch,
    handleResetSearch,
    handleSourceChange,
    handleArchivedChange,
    handlePageSizeChange,
    handleManualRefresh,
    handleAddNote,
    handleCloseEdit,
    handleListingUpdated,
    handleEditListing,
    handleCloseFullEdit,
    handleFullEditUpdated,
    handleArchive,
    handleDelete,
    sortBy,
    sortOrder,
    handleSortChange,
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
          onAdd={() => setIsCreateOpen(true)}
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
          isArchivedView={archivedFilter === 'archived'}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onAddNote={handleAddNote}
          onEdit={handleEditListing}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onSortChange={handleSortChange}
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

      <FullEditListingModal
        listing={editListing}
        onClose={handleCloseFullEdit}
        onUpdated={handleFullEditUpdated}
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

      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleManualRefresh}
      />
    </div>
  )
}

export default ListingsPage
