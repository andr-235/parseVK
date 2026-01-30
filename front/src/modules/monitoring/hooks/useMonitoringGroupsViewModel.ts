import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { monitoringService } from '@/modules/monitoring/api/monitoring.api'
import type { IMonitorGroupResponse, MonitoringMessenger } from '@/types/api'

const DEFAULT_CATEGORY_SUGGESTIONS = [
  'Новостные',
  'Оппозиционные',
  'Региональные',
  'Объявления',
  'Сообщества',
  'Другое',
]

type MonitoringGroupsViewModelOptions = {
  messenger: MonitoringMessenger
}

export const useMonitoringGroupsViewModel = ({ messenger }: MonitoringGroupsViewModelOptions) => {
  const [groups, setGroups] = useState<IMonitorGroupResponse[]>([])
  const [totalGroups, setTotalGroups] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [chatId, setChatId] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadGroups = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await monitoringService.fetchGroups({
        messenger,
        sync: messenger === 'whatsapp' || messenger === 'max',
      })
      setGroups(response.items)
      setTotalGroups(response.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }, [messenger])

  useEffect(() => {
    void loadGroups()
  }, [loadGroups])

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const normalizedCategory = categoryFilter.trim().toLowerCase()

    const items = groups.filter((group) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        group.name.toLowerCase().includes(normalizedSearch) ||
        group.chatId.toLowerCase().includes(normalizedSearch) ||
        (group.category ?? '').toLowerCase().includes(normalizedSearch)

      const matchesCategory =
        normalizedCategory.length === 0 ||
        (group.category ?? '').toLowerCase().includes(normalizedCategory)

      return matchesSearch && matchesCategory
    })

    return items.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [categoryFilter, groups, searchTerm])

  const categorySuggestions = useMemo(() => {
    const fromGroups = groups
      .map((group) => group.category)
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
    return Array.from(new Set([...DEFAULT_CATEGORY_SUGGESTIONS, ...fromGroups]))
  }, [groups])

  const resetForm = useCallback(() => {
    setChatId('')
    setName('')
    setCategory('')
    setEditingId(null)
  }, [])

  const startEdit = useCallback((group: IMonitorGroupResponse) => {
    setChatId(group.chatId)
    setName(group.name)
    setCategory(group.category ?? '')
    setEditingId(group.id)
  }, [])

  const saveGroup = useCallback(async () => {
    const trimmedChatId = chatId.trim()
    const trimmedName = name.trim()
    const trimmedCategory = category.trim()

    if (!trimmedChatId || !trimmedName) {
      toast.error('Укажите chat_id и название группы')
      return
    }

    if (isSaving) return
    setIsSaving(true)

    try {
      if (editingId) {
        await monitoringService.updateGroup(editingId, {
          chatId: trimmedChatId,
          name: trimmedName,
          category: trimmedCategory ? trimmedCategory : null,
        })
      } else {
        await monitoringService.createGroup({
          messenger,
          chatId: trimmedChatId,
          name: trimmedName,
          category: trimmedCategory ? trimmedCategory : null,
        })
      }

      await loadGroups()
      resetForm()
    } finally {
      setIsSaving(false)
    }
  }, [category, chatId, editingId, isSaving, loadGroups, messenger, name, resetForm])

  const deleteGroup = useCallback(
    async (id: number) => {
      await monitoringService.deleteGroup(id)
      if (editingId === id) {
        resetForm()
      }
      await loadGroups()
    },
    [editingId, loadGroups, resetForm]
  )

  return {
    groups: filteredGroups,
    totalGroups,
    isLoading,
    error,
    reloadGroups: loadGroups,
    isSaving,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    chatId,
    setChatId,
    name,
    setName,
    category,
    setCategory,
    editingId,
    startEdit,
    saveGroup,
    resetForm,
    deleteGroup,
    categorySuggestions,
  }
}
