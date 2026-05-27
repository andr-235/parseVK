import { PageHeader } from '@/components/common'
import { Plus, Upload, Download, RefreshCw, Database, Filter, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/common'
import { ListingsFilters } from '@/components/listings/ListingsFilters'
import { ListingsInfinite } from '@/components/listings/ListingsInfinite'
import ExportListingsModal from '@/components/listings/ExportListingsModal'
import ImportListingsModal from '@/components/listings/ImportListingsModal'
import EditListingModal from '@/components/listings/EditListingModal'
import CreateListingModal from '@/components/listings/CreateListingModal'
import { FullEditListingModal } from '@/components/listings/FullEditListingModal'
import { useListingsViewModel } from '@/hooks/listings/useListingsViewModel'

const PAGE_CARDS = [
  { icon: Database, title: 'База объявлений', subtitle: 'Централизованное хранение' },
  { icon: Upload,   title: 'Импорт',           subtitle: 'Загрузка из источников'       },
  { icon: Filter,   title: 'Фильтрация',      subtitle: 'Поиск и сортировка'            },
  { icon: Archive,  title: 'Управление',       subtitle: 'Статусы и архивация'           },
]

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
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title="Недвижимость"
          description="База объявлений из различных источников. Импорт, просмотр и управление статусами. Фильтрация по источникам и состоянию объявлений."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="lg"
                className="h-11 bg-primary/90 hover:bg-primary text-slate-900 font-semibold transition-all duration-200"
              >
                <Plus className="mr-2 w-5 h-5" />
                Добавить
              </Button>
              <Button
                onClick={() => setIsImportOpen(true)}
                size="lg"
                variant="outline"
                className="h-11 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50 transition-all duration-200"
              >
                <Upload className="mr-2 w-5 h-5" />
                Импорт
              </Button>
              <Button
                onClick={() => setIsExportOpen(true)}
                size="lg"
                variant="outline"
                className="h-11 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50 transition-all duration-200"
              >
                <Download className="mr-2 w-5 h-5" />
                Экспорт
              </Button>
              <Button
                onClick={handleManualRefresh}
                size="lg"
                variant="outline"
                className="h-11 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50 transition-all duration-200"
                disabled={isListLoading}
              >
                <RefreshCw className={cn('mr-2 w-5 h-5', isListLoading && 'animate-spin')} />
                Обновить
              </Button>
            </div>
          }
          cards={PAGE_CARDS}
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
