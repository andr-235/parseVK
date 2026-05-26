import { describe, expect, it } from 'vitest'
import {
  buildMonitoringGroupRows,
  getMonitoringGroupsCountLabel,
} from '@/hooks/monitoring/monitoringGroupsViewModel.utils'
import type { IMonitorGroupResponse } from '@/types/common'

const groups: IMonitorGroupResponse[] = [
  {
    id: 2,
    messenger: 'whatsapp',
    chatId: '200',
    name: 'Beta Updates',
    category: null,
    updatedAt: '2026-05-20T10:00:00.000Z',
  },
  {
    id: 1,
    messenger: 'whatsapp',
    chatId: '100',
    name: 'Alpha News',
    category: 'Новости',
    updatedAt: '2026-05-21T10:00:00.000Z',
  },
]

describe('monitoringGroupsViewModel utils', () => {
  it('filters, sorts and annotates monitoring group rows for the operator list', () => {
    const rows = buildMonitoringGroupRows({
      groups,
      searchTerm: 'news',
      categoryFilter: 'нов',
      editingId: null,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 1,
      sourceLabel: 'WhatsApp',
      categoryLabel: 'Новости',
      statusLabel: 'В мониторинге',
      statusTone: 'success',
    })
  })

  it('marks editing and missing-category rows explicitly', () => {
    const rows = buildMonitoringGroupRows({
      groups,
      searchTerm: '',
      categoryFilter: '',
      editingId: 2,
    })

    expect(rows.map((row) => row.name)).toEqual(['Alpha News', 'Beta Updates'])
    expect(rows[1]).toMatchObject({
      categoryLabel: 'Без категории',
      statusLabel: 'Редактируется',
      statusTone: 'info',
    })
  })

  it('formats the count label for filtered and unfiltered views', () => {
    expect(getMonitoringGroupsCountLabel({ shown: 2, total: 2, hasFilters: false })).toBe('2')
    expect(getMonitoringGroupsCountLabel({ shown: 1, total: 2, hasFilters: true })).toBe('1 из 2')
  })
})
