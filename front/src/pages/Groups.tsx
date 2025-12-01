import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'
import GroupsTableCard from './Groups/components/GroupsTableCard'
import RegionGroupsSearchCard from './Groups/components/RegionGroupsSearchCard'
import type { IRegionGroupSearchItem } from '../types/api'
import GroupInput from '../components/GroupInput'
import FileUpload from '../components/FileUpload'
import PageTitle from '../components/PageTitle'

function Groups() {
  const groups = useGroupsStore((state) => state.groups)
  const total = useGroupsStore((state) => state.total)
  const page = useGroupsStore((state) => state.page)
  const isLoading = useGroupsStore((state) => state.isLoading)
  const isLoadingMore = useGroupsStore((state) => state.isLoadingMore)
  const hasMore = useGroupsStore((state) => state.hasMore)
  const fetchGroups = useGroupsStore((state) => state.fetchGroups)
  const addGroup = useGroupsStore((state) => state.addGroup)
  const deleteGroup = useGroupsStore((state) => state.deleteGroup)
  const loadFromFile = useGroupsStore((state) => state.loadFromFile)
  const deleteAllGroups = useGroupsStore((state) => state.deleteAllGroups)
  const regionSearch = useGroupsStore((state) => state.regionSearch)
  const searchRegionGroups = useGroupsStore((state) => state.searchRegionGroups)
  const addGroupFromRegionSearch = useGroupsStore((state) => state.addGroupFromRegionSearch)
  const addSelectedRegionGroups = useGroupsStore((state) => state.addSelectedRegionSearchGroups)
  const removeRegionSearchGroup = useGroupsStore((state) => state.removeRegionSearchGroup)
  const loadMoreGroups = useGroupsStore((state) => state.loadMoreGroups)
  const resetRegionSearch = useGroupsStore((state) => state.resetRegionSearch)
  const [url, setUrl] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const groupsCount = total
  const hasGroups = groupsCount > 0

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return groups
    }

    return groups.filter((group) => {
      const nameMatch = group.name?.toLowerCase().includes(normalizedSearch)
      const screenNameMatch = group.screenName?.toLowerCase().includes(normalizedSearch)
      const vkIdMatch = String(group.vkId ?? '').includes(normalizedSearch)
      return Boolean(nameMatch || screenNameMatch || vkIdMatch)
    })
  }, [groups, searchTerm])

  useEffect(() => {
    if (page > 0 || isLoading) {
      return
    }

    void fetchGroups({ reset: true })
  }, [fetchGroups, isLoading, page])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMore) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || isLoading || isLoadingMore) {
          return
        }

        void loadMoreGroups().catch(() => {})
      })
    }, { root: null, threshold: 0.1 })

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, isLoadingMore, loadMoreGroups])

  const handleAddGroup = async () => {
    if (await addGroup(url)) {
      setUrl('')
    }
  }

  const handleUrlChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setUrl(target.value)
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await loadFromFile(file)
    }
  }

  const handleDeleteAllGroups = async () => {
    if (!hasGroups || isLoading) {
      return
    }

    const confirmed = window.confirm('Удалить все группы из списка и базы данных? Это действие нельзя отменить.')
    if (!confirmed) {
      return
    }

    try {
      await deleteAllGroups()
    } catch {
      // Ошибки обрабатываются в сервисе
    }
  }

  const handleRegionSearch = async () => {
    try {
      await searchRegionGroups()
    } catch {
      // Ошибка обработана в сервисе/toast
    }
  }

  const handleAddRegionGroup = async (group: IRegionGroupSearchItem) => {
    return await addGroupFromRegionSearch(group)
  }

  const handleAddSelectedRegionGroups = async (groups: IRegionGroupSearchItem[]) => {
    return await addSelectedRegionGroups(groups)
  }

  const handleRemoveRegionGroup = (vkGroupId: number) => {
    removeRegionSearchGroup(vkGroupId)
  }

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <PageTitle>Группы</PageTitle>
          <p className="max-w-2xl text-muted-foreground">
            Управляйте VK сообществами: добавляйте группы для парсинга, отслеживайте их метрики и аудиторию.
          </p>
        </div>
        
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAddGroup} />
          <FileUpload onUpload={handleFileUpload} buttonText="Импорт" className="shrink-0" />
        </div>
      </div>

      {/* Region Search Section - Collapsible or distinct area */}
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
          groups={filteredGroups}
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
