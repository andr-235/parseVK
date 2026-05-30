import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'
import { useGroupsStore } from '@/pages/groups/store'
import type { IRegionGroupSearchItem } from '@/shared/types'

export const useGroupsViewModel = () => {
  const groups = useGroupsStore((state) => state.groups)
  const total = useGroupsStore((state) => state.total)
  const page = useGroupsStore((state) => state.page)
  const isLoading = useGroupsStore((state) => state.isLoading)
  const isLoadingMore = useGroupsStore((state) => state.isLoadingMore)
  const hasMore = useGroupsStore((state) => state.hasMore)
  const error = useGroupsStore((state) => state.error)
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
    if (page > 0 || isLoading || error) {
      return
    }

    void fetchGroups({ reset: true })
  }, [fetchGroups, isLoading, page, error])

  useIntersectionObserver(
    loadMoreRef,
    () => {
      void loadMoreGroups().catch((error) => {
        if (import.meta.env.DEV) {
          console.error('Failed to load more groups:', error)
        }
      })
    },
    {
      enabled: hasMore && !isLoading && !isLoadingMore,
      threshold: 0.1,
    }
  )

  const handleAddGroup = useCallback(async () => {
    const success = await addGroup(url)
    if (success) {
      setUrl('')
      toast.success('Группа добавлена')
    } else {
      toast.error('Не удалось добавить группу')
    }
  }, [url, addGroup])

  const handleUrlChange = useCallback(({ target }: ChangeEvent<HTMLInputElement>) => {
    setUrl(target.value)
  }, [])

  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (file) {
        await loadFromFile(file)
      }
    },
    [loadFromFile]
  )

  const handleDeleteAllGroups = useCallback(async () => {
    if (!hasGroups || isLoading) {
      return
    }

    const confirmed = window.confirm(
      'Удалить все группы из списка и базы данных? Это действие нельзя отменить.'
    )
    if (!confirmed) {
      return
    }

    try {
      await deleteAllGroups()
    } catch {
      // Ошибки обрабатываются в сервисе
    }
  }, [hasGroups, isLoading, deleteAllGroups])

  const handleRegionSearch = useCallback(async () => {
    try {
      await searchRegionGroups()
    } catch {
      // Ошибка обработана в сервисе/toast
    }
  }, [searchRegionGroups])

  const handleAddRegionGroup = useCallback(
    async (group: IRegionGroupSearchItem) => {
      return await addGroupFromRegionSearch(group)
    },
    [addGroupFromRegionSearch]
  )

  const handleAddSelectedRegionGroups = useCallback(
    async (groups: IRegionGroupSearchItem[]) => {
      return await addSelectedRegionGroups(groups)
    },
    [addSelectedRegionGroups]
  )

  const handleRemoveRegionGroup = useCallback(
    (vkGroupId: number) => {
      removeRegionSearchGroup(vkGroupId)
    },
    [removeRegionSearchGroup]
  )

  return {
    groups: filteredGroups,
    groupsCount,
    hasGroups,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchTerm,
    url,
    loadMoreRef,
    regionSearch,
    setUrl,
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
  }
}
