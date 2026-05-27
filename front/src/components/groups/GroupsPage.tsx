import { getGroupTableColumns } from '@/config/groups/groupTableColumns'
import GroupsTableCard from '@/components/groups/GroupsTableCard'
import RegionGroupsSearchCard from '@/components/groups/RegionGroupsSearchCard'
import { PageHeader } from '@/components/common'
import GroupInput from '@/components/groups/GroupInput'
import FileUpload from '@/components/common/FileUpload'
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
    <div className="flex flex-col gap-8 pb-10 pt-6 font-monitoring-body max-w-[1600px] mx-auto w-full px-4 md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="simple"
          title={
            <>
              VK <span className="text-accent-primary">Группы</span>
            </>
          }
          description="Управляйте VK сообществами: добавляйте группы для парсинга, отслеживайте их метрики и аудиторию."
          actions={
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAddGroup} />
              <FileUpload
                onFilesSelect={handleFilesSelect}
                buttonText="Импорт"
                className="shrink-0"
              />
            </div>
          }
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
