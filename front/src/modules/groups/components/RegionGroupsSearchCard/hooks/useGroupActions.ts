import { useState, useCallback } from 'react'
import type { IRegionGroupSearchItem } from '@/shared/types'

interface UseGroupActionsProps {
  results: IRegionGroupSearchItem[]
  selectedGroups: IRegionGroupSearchItem[]
  hasSelection: boolean
  onAddGroup: (group: IRegionGroupSearchItem) => Promise<boolean> | boolean
  onAddSelected: (
    groups: IRegionGroupSearchItem[]
  ) => Promise<{ successCount: number; failedIds: number[] }>
  onRemoveGroup: (vkGroupId: number) => void
  onRemoveFromSelection: (groupId: number) => void
  onClearSelection: () => void
}

export const useGroupActions = ({
  results,
  selectedGroups,
  hasSelection,
  onAddGroup,
  onAddSelected,
  onRemoveGroup,
  onRemoveFromSelection,
  onClearSelection,
}: UseGroupActionsProps) => {
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  const handleAddGroups = useCallback(async () => {
    const groupsToAdd = hasSelection ? selectedGroups : results
    if (!groupsToAdd.length) return

    setIsBulkAdding(true)
    try {
      const result = await onAddSelected(groupsToAdd)
      const failedIds = result?.failedIds ?? []

      if (failedIds.length === 0) {
        onClearSelection()
      } else {
        // Keep only failed IDs selected
        onClearSelection()
        failedIds.forEach((id) => onRemoveFromSelection(id))
      }
    } finally {
      setIsBulkAdding(false)
    }
  }, [
    hasSelection,
    selectedGroups,
    results,
    onAddSelected,
    onClearSelection,
    onRemoveFromSelection,
  ])

  const handleAddSingleGroup = useCallback(
    async (group: IRegionGroupSearchItem) => {
      const success = await onAddGroup(group)
      if (success) {
        onRemoveFromSelection(group.id)
      }
    },
    [onAddGroup, onRemoveFromSelection]
  )

  const handleRemoveSingleGroup = useCallback(
    (groupId: number) => {
      onRemoveFromSelection(groupId)
      onRemoveGroup(groupId)
    },
    [onRemoveGroup, onRemoveFromSelection]
  )

  return {
    isBulkAdding,
    handleAddGroups,
    handleAddSingleGroup,
    handleRemoveSingleGroup,
  }
}
