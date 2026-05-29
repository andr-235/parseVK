import type { IMonitorGroupResponse, MonitoringMessenger } from '@/types/common'

export type MonitoringGroupStatusTone = 'success' | 'info' | 'warning'

export type MonitoringGroupRow = IMonitorGroupResponse & {
  sourceLabel: string
  categoryLabel: string
  statusLabel: string
  statusTone: MonitoringGroupStatusTone
  updatedLabel: string
}

type BuildMonitoringGroupRowsInput = {
  groups: IMonitorGroupResponse[]
  searchTerm: string
  categoryFilter: string
  editingId: number | null
}

type CountLabelInput = {
  shown: number
  total: number
  hasFilters: boolean
}

const SOURCE_LABELS: Record<MonitoringMessenger, string> = {
  whatsapp: 'WhatsApp',
  max: 'Max',
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const normalize = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? ''

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

const getStatus = (
  group: IMonitorGroupResponse,
  editingId: number | null
): Pick<MonitoringGroupRow, 'statusLabel' | 'statusTone'> => {
  if (editingId === group.id) {
    return {
      statusLabel: 'Редактируется',
      statusTone: 'info',
    }
  }

  if (!group.category?.trim()) {
    return {
      statusLabel: 'Категория не задана',
      statusTone: 'warning',
    }
  }

  return {
    statusLabel: 'В мониторинге',
    statusTone: 'success',
  }
}

export const buildMonitoringGroupRows = ({
  groups,
  searchTerm,
  categoryFilter,
  editingId,
}: BuildMonitoringGroupRowsInput): MonitoringGroupRow[] => {
  const normalizedSearch = normalize(searchTerm)
  const normalizedCategory = normalize(categoryFilter)

  return groups
    .filter((group) => {
      const category = group.category ?? ''
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalize(group.name).includes(normalizedSearch) ||
        normalize(group.chatId).includes(normalizedSearch) ||
        normalize(category).includes(normalizedSearch)

      const matchesCategory =
        normalizedCategory.length === 0 || normalize(category).includes(normalizedCategory)

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    .map((group) => {
      const status = getStatus(group, editingId)

      return {
        ...group,
        sourceLabel: SOURCE_LABELS[group.messenger],
        categoryLabel: group.category?.trim() || 'Без категории',
        updatedLabel: formatDateTime(group.updatedAt ?? group.createdAt),
        ...status,
      }
    })
}

export const getMonitoringGroupsCountLabel = ({
  shown,
  total,
  hasFilters,
}: CountLabelInput): string => (hasFilters ? `${shown} из ${total}` : `${total}`)
