import { TgmbaseBatchToolbar } from './TgmbaseBatchToolbar'
import { TgmbaseSearchHero } from './TgmbaseSearchHero'
import { EmptyState } from '@/shared/components/EmptyState'
import { useTgmbaseSearchState } from '@/modules/tgmbase-search/hooks/useTgmbaseSearchState'
import { useTgmbaseResultsViewModel } from '@/modules/tgmbase-search/hooks/useTgmbaseResultsViewModel'
import { TgmbaseResultsWorkspace } from './TgmbaseResultsWorkspace'

export default function TgmbaseSearchPage() {
  const vm = useTgmbaseSearchState()
  const response = vm.result
  const resultsVm = useTgmbaseResultsViewModel({
    items: response?.items ?? [],
    selectedQuery: vm.selectedQuery,
  })
  const selectedItem = resultsVm.selectedItem

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 py-6 font-monitoring-body md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <TgmbaseSearchHero />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <TgmbaseBatchToolbar
          value={vm.input}
          onChange={vm.setInput}
          isLoading={vm.isLoading}
          onSubmit={vm.submit}
          onNewBatch={vm.resetSearch}
          progress={vm.progress}
          hasResult={Boolean(response)}
        />
      </div>

      {response ? (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-150">
          <TgmbaseResultsWorkspace
            total={response.summary.total}
            summary={resultsVm.summary}
            activeStatuses={resultsVm.statusFilters}
            onToggleStatus={resultsVm.toggleStatus}
            onShowAllStatuses={resultsVm.clearStatusFilters}
            searchTerm={resultsVm.searchTerm}
            onSearchTermChange={resultsVm.setSearchTerm}
            queryTypeFilters={resultsVm.queryTypeFilters}
            onToggleQueryType={resultsVm.toggleQueryType}
            presenceFilters={resultsVm.presenceFilters}
            onSetPresenceFilter={resultsVm.setPresenceFilter}
            sortBy={resultsVm.sortBy}
            onSortChange={resultsVm.setSortBy}
            onResetFilters={resultsVm.resetFilters}
            items={resultsVm.visibleItems}
            selectedQuery={resultsVm.selectedQuery}
            selectedItem={selectedItem}
            onSelect={resultsVm.setSelectedQuery}
            onMoveSelection={resultsVm.moveSelection}
            isLoadingMore={vm.loadingMoreQuery === selectedItem?.query}
            onLoadMore={() => {
              if (selectedItem) {
                void vm.loadMoreMessages(selectedItem)
              }
            }}
            hasActiveFilters={resultsVm.hasActiveFilters}
          />
        </div>
      ) : (
        <EmptyState
          title="Поиск ещё не запускался"
          description="Вставь список идентификаторов и запусти массовый поиск по tgmbase."
        />
      )}
    </div>
  )
}
