import { describe, expect, it } from 'vitest'
import { createTelegramSubItems, PRIMARY_ITEMS_CONFIG } from '@/shared/components/Sidebar/constants'

describe('Sidebar constants', () => {
  it('builds telegram section items with renamed entries', () => {
    expect(createTelegramSubItems()).toEqual([
      { label: 'Парсинг пользователей', path: '/telegram' },
      { label: 'Поиск по местным каналам', path: '/tgmbase-search' },
    ])
  })

  it('removes telegram links from primary items config', () => {
    expect(PRIMARY_ITEMS_CONFIG).toEqual([])
  })
})
