import { useEffect, useMemo, useState } from 'react'
import type { TgmbaseQueryType, TgmbaseSearchItem, TgmbaseSearchStatus } from '@/shared/types'

export type TgmbaseSortMode =
  | 'priority'
  | 'input'
  | 'status'
  | 'messagesDesc'
  | 'contactsDesc'
  | 'groupsDesc'
export type PresenceFilterKey = 'hasProfile' | 'hasGroups' | 'hasContacts' | 'hasMessages'

interface UseTgmbaseResultsViewModelOptions {
  items: TgmbaseSearchItem[]
  selectedQuery: string | null
}

interface PresenceFilters {
  hasProfile: boolean
  hasGroups: boolean
  hasContacts: boolean
  hasMessages: boolean
}

export type TgmbasePresenceFilters = PresenceFilters

const DEFAULT_PRESENCE_FILTERS: PresenceFilters = {
  hasProfile: false,
  hasGroups: false,
  hasContacts: false,
  hasMessages: false,
}

const STATUS_PRIORITY: Record<TgmbaseSearchStatus, number> = {
  error: 0,
  not_found: 1,
  ambiguous: 2,
  invalid: 3,
  found: 4,
}

const normalizeSearchText = (value: string) => value.trim().toLowerCase()

const buildSearchIndex = (item: TgmbaseSearchItem) =>
  [
    item.query,
    item.normalizedQuery,
    item.profile?.fullName,
    item.profile?.username,
    item.profile?.phoneNumber,
    item.profile?.telegramId,
    ...item.candidates.map((candidate) => candidate.fullName),
    ...item.candidates.map((candidate) => candidate.username),
    ...item.candidates.map((candidate) => candidate.phoneNumber),
    ...item.groups.map((group) => group.title),
    ...item.contacts.map((contact) => contact.fullName),
    ...item.contacts.map((contact) => contact.username),
    ...item.contacts.map((contact) => contact.phoneNumber),
  ]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase()

const sortItems = (items: TgmbaseSearchItem[], sortBy: TgmbaseSortMode) => {
  const copy = [...items]

  copy.sort((left, right) => {
    switch (sortBy) {
      case 'status':
        return STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status]
      case 'messagesDesc':
        return right.stats.messages - left.stats.messages
      case 'contactsDesc':
        return right.stats.contacts - left.stats.contacts
      case 'groupsDesc':
        return right.stats.groups - left.stats.groups
      case 'input':
        return 0
      case 'priority':
      default:
        return STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status]
    }
  })

  return copy
}

export function useTgmbaseResultsViewModel({
  items,
  selectedQuery: initialSelectedQuery,
}: UseTgmbaseResultsViewModelOptions) {
  const [selectedQuery, setSelectedQuery] = useState<string | null>(initialSelectedQuery)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<TgmbaseSortMode>('priority')
  const [statusFilters, setStatusFilters] = useState<TgmbaseSearchStatus[]>([])
  const [queryTypeFilters, setQueryTypeFilters] = useState<TgmbaseQueryType[]>([])
  const [presenceFilters, setPresenceFilters] = useState<PresenceFilters>(DEFAULT_PRESENCE_FILTERS)

  useEffect(() => {
    setSelectedQuery(initialSelectedQuery)
  }, [initialSelectedQuery])

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1
        acc[item.status] += 1
        return acc
      },
      {
        total: 0,
        found: 0,
        not_found: 0,
        ambiguous: 0,
        invalid: 0,
        error: 0,
      } as Record<'total' | TgmbaseSearchStatus, number>
    )
  }, [items])

  const normalizedSearchTerm = normalizeSearchText(searchTerm)

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (statusFilters.length > 0 && !statusFilters.includes(item.status)) {
        return false
      }

      if (queryTypeFilters.length > 0 && !queryTypeFilters.includes(item.queryType)) {
        return false
      }

      if (presenceFilters.hasProfile && !item.profile) {
        return false
      }

      if (presenceFilters.hasGroups && item.stats.groups <= 0) {
        return false
      }

      if (presenceFilters.hasContacts && item.stats.contacts <= 0) {
        return false
      }

      if (presenceFilters.hasMessages && item.stats.messages <= 0) {
        return false
      }

      if (
        normalizedSearchTerm.length > 0 &&
        !buildSearchIndex(item).includes(normalizedSearchTerm)
      ) {
        return false
      }

      return true
    })

    return sortItems(filtered, sortBy)
  }, [items, normalizedSearchTerm, presenceFilters, queryTypeFilters, sortBy, statusFilters])

  const selectedItem = useMemo(() => {
    if (visibleItems.length === 0) {
      return null
    }

    return visibleItems.find((item) => item.query === selectedQuery) ?? visibleItems[0]
  }, [selectedQuery, visibleItems])

  useEffect(() => {
    const nextSelectedQuery = selectedItem?.query ?? null
    if (selectedQuery !== nextSelectedQuery) {
      setSelectedQuery(nextSelectedQuery)
    }
  }, [selectedItem, selectedQuery])

  const hasActiveFilters =
    normalizedSearchTerm.length > 0 ||
    statusFilters.length > 0 ||
    queryTypeFilters.length > 0 ||
    Object.values(presenceFilters).some(Boolean)

  const toggleStatus = (status: TgmbaseSearchStatus) => {
    setStatusFilters((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status]
    )
  }

  const toggleQueryType = (queryType: TgmbaseQueryType) => {
    setQueryTypeFilters((current) =>
      current.includes(queryType)
        ? current.filter((item) => item !== queryType)
        : [...current, queryType]
    )
  }

  const setPresenceFilter = (key: PresenceFilterKey, enabled: boolean) => {
    setPresenceFilters((current) => ({
      ...current,
      [key]: enabled,
    }))
  }

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilters([])
    setQueryTypeFilters([])
    setPresenceFilters(DEFAULT_PRESENCE_FILTERS)
  }

  const clearStatusFilters = () => {
    setStatusFilters([])
  }

  const moveSelection = (direction: 'next' | 'previous') => {
    if (visibleItems.length === 0) {
      return
    }

    const currentIndex = visibleItems.findIndex((item) => item.query === selectedItem?.query)
    const fallbackIndex = direction === 'next' ? 0 : visibleItems.length - 1
    const nextIndex =
      currentIndex === -1
        ? fallbackIndex
        : direction === 'next'
          ? Math.min(currentIndex + 1, visibleItems.length - 1)
          : Math.max(currentIndex - 1, 0)

    setSelectedQuery(visibleItems[nextIndex]?.query ?? null)
  }

  return {
    clearStatusFilters,
    hasActiveFilters,
    moveSelection,
    presenceFilters,
    queryTypeFilters,
    resetFilters,
    searchTerm,
    selectedItem,
    selectedQuery,
    setSearchTerm,
    setSelectedQuery,
    setPresenceFilter,
    setSortBy,
    sortBy,
    statusFilters,
    summary,
    toggleQueryType,
    toggleStatus,
    visibleItems,
  }
}
