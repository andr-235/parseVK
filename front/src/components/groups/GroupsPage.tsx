import { getGroupTableColumns } from '@/config/groups/groupTableColumns'
import GroupsTableCard from '@/components/groups/GroupsTableCard'
import RegionGroupsSearchCard from '@/components/groups/RegionGroupsSearchCard'
import { GroupsHero } from '@/components/groups/GroupsHero'
import { useGroupsViewModel } from '@/hooks/groups/useGroupsViewModel'

function GroupsPage() {
  const {
    groups,
    groupsCount,
    isLoading,
    isLoadingMore,
    hasMore,
    searchTerm,
    url,
    loadMoreRef,
    regionSearch,
    setSearchTerm,
    handleAddGroup,
    handleUrlChange,
    handleFilesSelect,
    handleDeleteAllGroups,
    handleRegionSearch,
    handleAddRegionGroup,
    handleAddSelectedRegionGroups,
    handleRemoveRegionGroup,
    deleteGroup,
    resetRegionSearch,
  } = useGroupsViewModel()

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <GroupsHero
          url={url}
          onUrlChange={handleUrlChange}
          onAdd={handleAddGroup}
          onFilesSelect={handleFilesSelect}
        />
      </div>

      {/* Content Cards - staggered animation */}
      <div className="space-y-6">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
          <RegionGroupsSearchCard
            total={regionSearch.total}
            results={regionSearch.missing}
            isLoading={regionSearch.isLoading}
            error={regionSearch.error}
            onSearch={handleRegionSearch}
            onAddGroup={handleAddRegionGroup}
            onAddSelected={handleAddSelectedRegionGroups}
            onRemoveGroup={handleRemoveRegionGroup}
            onReset={resetRegionSearch}
          />
        </div>

        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
          <GroupsTableCard
            groups={groups}
            totalCount={groupsCount}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClear={handleDeleteAllGroups}
            onDelete={deleteGroup}
            columns={getGroupTableColumns}
          />
        </div>

        {hasMore && <div ref={loadMoreRef} className="h-1 w-full" />}
      </div>
    </div>
  )
}

export default GroupsPage
