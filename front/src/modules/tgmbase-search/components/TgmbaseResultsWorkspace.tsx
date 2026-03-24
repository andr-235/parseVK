import type {
  TgmbasePresenceFilters,
  TgmbaseSortMode,
} from '@/modules/tgmbase-search/hooks/useTgmbaseResultsViewModel'
import type { TgmbaseQueryType, TgmbaseSearchItem, TgmbaseSearchStatus } from '@/shared/types'
import { TgmbaseResultDetails } from './TgmbaseResultDetails'
import { TgmbaseResultsFilters } from './TgmbaseResultsFilters'
import { TgmbaseResultsList } from './TgmbaseResultsList'
import { TgmbaseResultsSummary } from './TgmbaseResultsSummary'

interface TgmbaseResultsWorkspaceProps {
  total: number
  summary: Record<'total' | TgmbaseSearchStatus, number>
  activeStatuses: TgmbaseSearchStatus[]
  onToggleStatus: (status: TgmbaseSearchStatus) => void
  onShowAllStatuses: () => void
  searchTerm: string
  onSearchTermChange: (value: string) => void
  queryTypeFilters: TgmbaseQueryType[]
  onToggleQueryType: (value: TgmbaseQueryType) => void
  presenceFilters: TgmbasePresenceFilters
  onSetPresenceFilter: (key: keyof TgmbasePresenceFilters, value: boolean) => void
  sortBy: TgmbaseSortMode
  onSortChange: (value: TgmbaseSortMode) => void
  onResetFilters: () => void
  items: TgmbaseSearchItem[]
  selectedQuery: string | null
  selectedItem: TgmbaseSearchItem | null
  onSelect: (query: string) => void
  onMoveSelection: (direction: 'next' | 'previous') => void
  isLoadingMore: boolean
  onLoadMore: () => void
  hasActiveFilters: boolean
}

export function TgmbaseResultsWorkspace(props: TgmbaseResultsWorkspaceProps) {
  return (
    <section className="space-y-4">
      <TgmbaseResultsSummary
        total={props.total}
        summary={props.summary}
        activeStatuses={props.activeStatuses}
        onToggleStatus={props.onToggleStatus}
        onShowAll={props.onShowAllStatuses}
      />

      <TgmbaseResultsFilters
        searchTerm={props.searchTerm}
        onSearchTermChange={props.onSearchTermChange}
        queryTypeFilters={props.queryTypeFilters}
        onToggleQueryType={props.onToggleQueryType}
        presenceFilters={props.presenceFilters}
        onSetPresenceFilter={props.onSetPresenceFilter}
        sortBy={props.sortBy}
        onSortChange={props.onSortChange}
        onResetFilters={props.onResetFilters}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <TgmbaseResultsList
          items={props.items}
          selectedQuery={props.selectedQuery}
          onSelect={props.onSelect}
          onMoveSelection={props.onMoveSelection}
        />
        <TgmbaseResultDetails
          item={props.selectedItem}
          isLoadingMore={props.isLoadingMore}
          onLoadMore={props.onLoadMore}
          hasActiveFilters={props.hasActiveFilters}
          onResetFilters={props.onResetFilters}
        />
      </div>
    </section>
  )
}
