import { describe, expect, it } from 'vitest'
import {
  createPrimaryItems,
  createTelegramSubItems,
  PRIMARY_ITEMS_CONFIG,
} from '@/components/common/Sidebar/constants'

describe('Sidebar constants', () => {
  it('builds telegram section items with renamed entries', () => {
    expect(createTelegramSubItems()).toEqual([
      { label: 'Выгрузка пользователей', path: '/telegram', icon: expect.anything() },
      { label: 'Поиск по местным каналам', path: '/tgmbase-search', icon: expect.anything() },
      { label: 'Выгрузка с ДЛ', path: '/telegram/dl-upload', icon: expect.anything() },
    ])
  })

  it('removes telegram links from primary items config', () => {
    expect(PRIMARY_ITEMS_CONFIG).toEqual([])
  })

  it('builds primary items from config without throwing on empty config', () => {
    expect(createPrimaryItems()).toEqual([])
  })
})
