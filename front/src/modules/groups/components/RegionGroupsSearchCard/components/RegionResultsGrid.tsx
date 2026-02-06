import type { IRegionGroupSearchItem } from '@/shared/types'
import { RegionGroupCard } from './RegionGroupCard'

interface RegionResultsGridProps {
  sortedResults: IRegionGroupSearchItem[]
  selectedIds: Set<number>
  isBulkAdding: boolean
  onToggleSelection: (groupId: number) => void
  onAddGroup: (group: IRegionGroupSearchItem) => void | Promise<void>
  onRemoveGroup: (groupId: number) => void
}

export const RegionResultsGrid = ({
  sortedResults,
  selectedIds,
  isBulkAdding,
  onToggleSelection,
  onAddGroup,
  onRemoveGroup,
}: RegionResultsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedResults.map((group, index) => (
        <div
          key={group.id}
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <RegionGroupCard
            group={group}
            isSelected={selectedIds.has(group.id)}
            isBulkAdding={isBulkAdding}
            onToggleSelection={onToggleSelection}
            onAddGroup={onAddGroup}
            onRemoveGroup={onRemoveGroup}
          />
        </div>
      ))}
    </div>
  )
}
