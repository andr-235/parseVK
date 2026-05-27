import type { IRegionGroupSearchItem } from '@/types/common'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useTableSorting } from '@/hooks/common'
import { groupColumns } from './RegionGroupsSearchCard/utils/groupColumns'
import { useGroupSelection } from './RegionGroupsSearchCard/hooks/useGroupSelection'
import { useGroupActions } from './RegionGroupsSearchCard/hooks/useGroupActions'
import { RegionSearchHeader } from './RegionGroupsSearchCard/components/RegionSearchHeader'
import { RegionSearchControls } from './RegionGroupsSearchCard/components/RegionSearchControls'
import { RegionResultsGrid } from './RegionGroupsSearchCard/components/RegionResultsGrid'

interface RegionGroupsSearchCardProps {
  total: number
  results: IRegionGroupSearchItem[]
  isLoading: boolean
  error: string | null
  onSearch: () => Promise<void> | void
  onAddGroup: (group: IRegionGroupSearchItem) => Promise<boolean> | boolean
  onAddSelected: (
    groups: IRegionGroupSearchItem[]
  ) => Promise<{ successCount: number; failedIds: number[] }>
  onRemoveGroup: (vkGroupId: number) => void
  onReset?: () => void
}

function RegionGroupsSearchCard({
  total,
  results,
  isLoading,
  error,
  onSearch,
  onAddGroup,
  onAddSelected,
  onRemoveGroup,
  onReset,
}: RegionGroupsSearchCardProps) {
  // Sorting
  const {
    sortedItems: sortedResults,
    sortState,
    requestSort,
  } = useTableSorting(results, groupColumns, {
    initialKey: 'members_count',
    initialDirection: 'desc',
  })

  // Selection
  const selection = useGroupSelection(results, sortedResults)

  // Actions
  const actions = useGroupActions({
    results,
    selectedGroups: selection.selectedGroups,
    hasSelection: selection.hasSelection,
    onAddGroup,
    onAddSelected,
    onRemoveGroup,
    onRemoveFromSelection: selection.removeFromSelection,
    onClearSelection: selection.clearSelection,
  })

  const hasResults = sortedResults.length > 0
  const canSearch = !isLoading && !actions.isBulkAdding

  const handleReset = () => {
    onReset?.()
    selection.clearSelection()
  }

  const currentSortLabel =
    groupColumns.find((c) => c.key === sortState?.key)?.header || 'Сортировка'

  return (
    <Card className="relative overflow-hidden rounded-card border border-border bg-background-secondary shadow-soft-sm">
      {/* Header */}
      <RegionSearchHeader
        total={total}
        hasResults={hasResults}
        isLoading={isLoading}
        canSearch={canSearch}
        onSearch={onSearch}
        onReset={handleReset}
      />

      {/* Content */}
      <CardContent className="p-0">
        {error && (
          <div className="animate-in slide-in-from-top-2 fade-in-0 m-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="font-mono-accent">⚠</span> {error}
          </div>
        )}

        {isLoading && !hasResults && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="mr-2" />
            <span className="font-mono-accent text-sm text-text-secondary">
              Выполняется поиск групп...
            </span>
          </div>
        )}

        {!isLoading && !hasResults && total > 0 && !error && (
          <div className="p-6 text-center text-sm text-text-secondary">
            Все найденные группы уже добавлены в базу данных.
          </div>
        )}

        {!isLoading && !hasResults && total === 0 && !error && (
          <div className="p-6 text-center text-sm text-text-secondary">
            В регионе пока не найдено сообществ, отсутствующих в базе.
          </div>
        )}

        {hasResults && (
          <div className="flex flex-col">
            <RegionSearchControls
              selectAllRef={selection.selectAllRef}
              isAllSelected={selection.isAllSelected}
              hasResults={hasResults}
              isLoading={isLoading}
              isBulkAdding={actions.isBulkAdding}
              hasSelection={selection.hasSelection}
              selectionSize={selection.selectionSize}
              resultsLength={results.length}
              columns={groupColumns}
              sortState={sortState}
              currentSortLabel={currentSortLabel}
              onToggleSelectAll={selection.toggleSelectAll}
              onRequestSort={requestSort}
              onAddGroups={actions.handleAddGroups}
            />

            <RegionResultsGrid
              sortedResults={sortedResults}
              selectedIds={selection.selectedIds}
              isBulkAdding={actions.isBulkAdding}
              onToggleSelection={selection.toggleSelection}
              onAddGroup={actions.handleAddSingleGroup}
              onRemoveGroup={actions.handleRemoveSingleGroup}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RegionGroupsSearchCard
