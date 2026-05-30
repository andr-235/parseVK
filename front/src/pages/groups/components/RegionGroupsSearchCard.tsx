import { useState, useCallback, useEffect } from 'react'
import type { IRegionGroupSearchItem } from '@/shared/types'
import { Spinner } from '@/shared/components/ui/spinner'
import { useTableSorting } from '@/shared/hooks'
import { RegionSearchHeader } from './RegionSearchHeader'
import { RegionSearchResults } from './RegionSearchResults'
import { regionSortColumns } from '../utils/regionSearchHelpers'

interface RegionGroupsSearchCardProps {
  total: number
  results: IRegionGroupSearchItem[]
  isLoading: boolean
  error: string | null
  onSearch: () => Promise<void> | void
  onAddGroup: (group: IRegionGroupSearchItem) => Promise<boolean> | boolean
  onAddSelected: (groups: IRegionGroupSearchItem[]) => Promise<{ successCount: number; failedIds: number[] }>
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
  const [open, setOpen] = useState(false)

  const {
    sortedItems: sortedResults,
    sortState,
    requestSort,
  } = useTableSorting(results, regionSortColumns, {
    initialKey: 'members_count',
    initialDirection: 'desc',
  })

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  const hasResults = sortedResults.length > 0
  const canSearch = !isLoading && !isBulkAdding

  const isAllSelected = hasResults && sortedResults.every((g) => selectedIds.has(g.id))
  const hasSelection = selectedIds.size > 0
  const isSelectionPartial = hasSelection && !isAllSelected

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (!hasResults) { setSelectedIds(new Set()); return }
      if (checked) {
        setSelectedIds(new Set(sortedResults.map((g) => g.id)))
      } else {
        setSelectedIds(new Set())
      }
    },
    [hasResults, sortedResults]
  )

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleAddSingle = useCallback(
    async (group: IRegionGroupSearchItem) => {
      await onAddGroup(group)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(group.id)
        return next
      })
    },
    [onAddGroup]
  )

  const handleAddSelected = useCallback(async () => {
    const groupsToAdd = hasSelection
      ? sortedResults.filter((g) => selectedIds.has(g.id))
      : sortedResults
    if (!groupsToAdd.length) return

    setIsBulkAdding(true)
    try {
      const result = await onAddSelected(groupsToAdd)
      setSelectedIds(new Set(result?.failedIds ?? []))
    } finally {
      setIsBulkAdding(false)
    }
  }, [hasSelection, selectedIds, sortedResults, onAddSelected])

  const handleRemove = useCallback(
    (id: number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      onRemoveGroup(id)
    },
    [onRemoveGroup]
  )

  const handleReset = useCallback(() => {
    onReset?.()
    setSelectedIds(new Set())
  }, [onReset])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <section className="overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm">
      <RegionSearchHeader
        open={open}
        total={total}
        canSearch={canSearch}
        isLoading={isLoading}
        onToggle={() => setOpen((v) => !v)}
        onSearch={() => { void onSearch() }}
        onReset={handleReset}
      />

      {open && (
        <div className="border-t border-border/40">
          {error && (
            <div className="mx-3 mt-3 rounded-lg border border-accent-danger/20 bg-accent-danger/10 px-3.5 py-2.5 text-xs text-accent-danger">
              {error}
            </div>
          )}

          {isLoading && !hasResults && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-text-secondary">
              <Spinner className="size-4" />
              Поиск групп...
            </div>
          )}

          {!isLoading && !hasResults && total > 0 && !error && (
            <div className="py-8 text-center text-xs text-text-secondary">
              Все найденные группы уже добавлены в базу данных.
            </div>
          )}

          {!isLoading && !hasResults && total === 0 && !error && (
            <div className="py-8 text-center text-xs text-text-secondary">
              Нажмите &laquo;Найти&raquo; для поиска групп в регионе, отсутствующих в базе.
            </div>
          )}

          {hasResults && (
            <RegionSearchResults
              results={results}
              sortedResults={sortedResults}
              sortState={sortState}
              selectedIds={selectedIds}
              isAllSelected={isAllSelected}
              isSelectionPartial={isSelectionPartial}
              hasSelection={hasSelection}
              isLoading={isLoading}
              isBulkAdding={isBulkAdding}
              onToggleSelectAll={toggleSelectAll}
              onToggleSelection={toggleSelection}
              onAddSingle={handleAddSingle}
              onAddSelected={handleAddSelected}
              onRemove={handleRemove}
              onRequestSort={requestSort}
            />
          )}
        </div>
      )}
    </section>
  )
}

export default RegionGroupsSearchCard
