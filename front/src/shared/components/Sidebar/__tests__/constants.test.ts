import { describe, expect, it } from 'vitest'
import {
  createPrimaryItems,
  createTelegramSubItems,
  PRIMARY_ITEMS_CONFIG,
} from '@/shared/components/Sidebar/constants'

describe('Sidebar constants', () => {
  it('builds telegram section items with renamed entries', () => {
    expect(createTelegramSubItems()).toEqual([
      { label: 'Выгрузка пользователей', path: '/telegram' },
      { label: 'Поиск по местным каналам', path: '/tgmbase-search' },
      { label: 'Выгрузка с ДЛ', path: '/telegram/dl-upload' },
    ])
  })

  it('removes telegram links from primary items config', () => {
    expect(PRIMARY_ITEMS_CONFIG).toEqual([])
  })

  it('builds primary items from config without throwing on empty config', () => {
    expect(createPrimaryItems()).toEqual([])
  })
})
