import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { IRegionGroupSearchItem } from '@/shared/types'

export const useGroupSelection = (
  results: IRegionGroupSearchItem[],
  sortedResults: IRegionGroupSearchItem[]
) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set<number>())
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  // Sync selection with results (remove IDs that no longer exist)
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev
      const next = new Set<number>()
      for (const group of results) {
        if (prev.has(group.id)) next.add(group.id)
      }
      return next.size === prev.size ? prev : next
    })
  }, [results])

  // Create results map for fast lookup
  const resultsMap = useMemo(() => {
    const map = new Map<number, IRegionGroupSearchItem>()
    results.forEach((group) => map.set(group.id, group))
    return map
  }, [results])

  // Computed values
  const hasResults = sortedResults.length > 0
  const isAllSelected = hasResults && sortedResults.every((group) => selectedIds.has(group.id))
  const hasSelection = selectedIds.size > 0
  const isSelectionPartial = hasSelection && !isAllSelected
  const selectionSize = selectedIds.size

  const selectedGroups = useMemo(() => {
    if (!hasSelection) return []
    const items: IRegionGroupSearchItem[] = []
    selectedIds.forEach((id) => {
      const group = resultsMap.get(id)
      if (group) items.push(group)
    })
    return items
  }, [hasSelection, resultsMap, selectedIds])

  // Set indeterminate state on checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSelectionPartial
    }
  }, [isSelectionPartial])

  // Selection handlers
  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (!hasResults) {
        setSelectedIds(new Set<number>())
        return
      }
      if (checked) {
        const next = new Set<number>()
        sortedResults.forEach((group) => next.add(group.id))
        setSelectedIds(next)
      } else {
        setSelectedIds(new Set<number>())
      }
    },
    [hasResults, sortedResults]
  )

  const toggleSelection = useCallback((groupId: number) => {
    setSelectedIds((prev) => {
      const next = new Set<number>(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set<number>())
  }, [])

  const removeFromSelection = useCallback((groupId: number) => {
    setSelectedIds((prev) => {
      if (!prev.has(groupId)) return prev
      const next = new Set<number>(prev)
      next.delete(groupId)
      return next
    })
  }, [])

  return {
    selectedIds,
    selectAllRef,
    isAllSelected,
    hasSelection,
    isSelectionPartial,
    selectionSize,
    selectedGroups,
    toggleSelectAll,
    toggleSelection,
    clearSelection,
    removeFromSelection,
  }
}
