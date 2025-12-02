import { useEffect, useMemo, useState } from 'react'
import type { Group } from '@/types'

const getDisplayName = (group: Group): string => {
  if (group.name && group.name.trim() !== '') {
    return group.name
  }

  if (group.screenName && group.screenName.trim() !== '') {
    return group.screenName
  }

  if (typeof group.vkId === 'number') {
    return 'Группа ' + group.vkId
  }

  return 'Группа ' + group.id
}

export function useCreateParseTaskModal(groups: Group[], isOpen: boolean) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setSearch('')
      return
    }

    setSelectedIds(new Set(groups.map((group) => group.id)))
  }, [isOpen, groups])

  const filteredGroups = useMemo(() => {
    if (!search.trim()) {
      return groups
    }

    const normalized = search.toLowerCase()
    return groups.filter((group) => {
      const display = getDisplayName(group).toLowerCase()
      const vkId = group.vkId ? String(group.vkId) : ''
      const id = String(group.id)
      return display.includes(normalized) || vkId.includes(normalized) || id.includes(normalized)
    })
  }, [groups, search])

  const handleToggle = (groupId: number | string) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev)
      if (updated.has(groupId)) {
        updated.delete(groupId)
      } else {
        updated.add(groupId)
      }
      return updated
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(groups.map((group) => group.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  return {
    selectedIds,
    search,
    setSearch,
    filteredGroups,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
    getDisplayName,
  }
}
