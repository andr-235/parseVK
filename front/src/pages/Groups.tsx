import { getGroupTableColumns } from '@/modules/groups/config/groupTableColumns'
import GroupsTableCard from '@/modules/groups/components/GroupsTableCard'
import RegionGroupsSearchCard from '@/modules/groups/components/RegionGroupsSearchCard'
import { GroupsHero } from '@/modules/groups/components/GroupsHero'
import { useGroupsViewModel } from '@/modules/groups/hooks/useGroupsViewModel'

function Groups() {
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
    handleFileUpload,
    handleDeleteAllGroups,
    handleRegionSearch,
    handleAddRegionGroup,
    handleAddSelectedRegionGroups,
    handleRemoveRegionGroup,
    deleteGroup,
    resetRegionSearch,
  } = useGroupsViewModel()

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      <GroupsHero
        url={url}
        onUrlChange={handleUrlChange}
        onAdd={handleAddGroup}
        onFileUpload={handleFileUpload}
      />

      <div className="space-y-6">
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

        {hasMore && <div ref={loadMoreRef} className="h-1 w-full" />}
      </div>
    </div>
  )
}

export default Groups
