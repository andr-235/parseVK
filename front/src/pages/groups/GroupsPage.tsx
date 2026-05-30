import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader, PageContainer } from '@/shared/components/common'
import RegionGroupsSearchCard from '@/pages/groups/components/RegionGroupsSearchCard'
import { GroupsSection } from '@/pages/groups/components/GroupsSection'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import FileUpload from '@/shared/components/common/FileUpload'
import { useGroupsViewModel } from '@/pages/groups/hooks/useGroupsViewModel'

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

  const onAdd = useCallback(() => {
    handleAddGroup()
  }, [handleAddGroup])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onAdd()
      }
    },
    [onAdd]
  )

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <PageHeader
        title="VK Группы"
        description="Управляйте сообществами: добавляйте для парсинга, отслеживайте метрики и аудиторию."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Input
                value={url}
                onChange={handleUrlChange}
                onKeyDown={handleKeyDown}
                placeholder="https://vk.com/группа"
                className="h-10 w-full border-border bg-background-secondary text-sm text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 sm:w-[280px]"
              />
              <Button
                onClick={onAdd}
                className="h-10 shrink-0 bg-accent-primary px-4 text-sm font-semibold text-text-light hover:bg-accent-primary/90 active:translate-y-px shadow-soft-sm hover:shadow-soft-md"
              >
                <Plus className="mr-1.5 size-4" />
                Добавить
              </Button>
            </div>
            <FileUpload
              onFilesSelect={handleFilesSelect}
              buttonText="Импорт"
              buttonClassName="h-10"
              className="shrink-0"
            />
          </div>
        }
      />

      {/* Region search panel */}
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

      {/* Groups grid */}
      <GroupsSection
        groups={groups}
        totalCount={groupsCount}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onDeleteGroup={deleteGroup}
        onClear={handleDeleteAllGroups}
      />

      {hasMore && <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />}
    </PageContainer>
  )
}

export default GroupsPage
