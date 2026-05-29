import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TgmbaseSearchItem, TgmbaseSearchStatus } from '@/shared/types'
import { useTgmbaseResultsViewModel } from '../useTgmbaseResultsViewModel'

const createItem = (
  query: string,
  status: TgmbaseSearchStatus,
  overrides: Partial<TgmbaseSearchItem> = {}
): TgmbaseSearchItem => ({
  query,
  normalizedQuery: query.replace('@', ''),
  queryType: query.startsWith('@') ? 'username' : 'telegramId',
  status,
  profile:
    status === 'found'
      ? {
          id: `${query}-profile`,
          telegramId: query.replace('@', ''),
          username: query.startsWith('@') ? query.slice(1) : null,
          phoneNumber: null,
          firstName: 'Ivan',
          lastName: 'Petrov',
          fullName: 'Ivan Petrov',
          bot: false,
          scam: false,
          premium: false,
          updatedAt: '2024-06-01T00:00:00.000Z',
        }
      : null,
  candidates: [],
  groups: [],
  contacts: [],
  messagesPage: {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  },
  stats: {
    groups: 0,
    contacts: 0,
    messages: 0,
  },
  error: null,
  ...overrides,
})

describe('useTgmbaseResultsViewModel', () => {
  it('prioritizes problematic rows and autoselects first visible item', () => {
    const items = [
      createItem('123', 'found'),
      createItem('error-row', 'error'),
      createItem('404-row', 'not_found'),
    ]

    const { result } = renderHook(() =>
      useTgmbaseResultsViewModel({
        items,
        selectedQuery: null,
      })
    )

    expect(result.current.visibleItems[0]?.status).toBe('error')
    expect(result.current.selectedItem?.status).toBe('error')
  })

  it('filters by text, status, query type and presence flags', () => {
    const items = [
      createItem('123', 'found', {
        profile: {
          id: 'p1',
          telegramId: '123',
          username: 'ivan',
          phoneNumber: '+79990000001',
          firstName: 'Ivan',
          lastName: 'Petrov',
          fullName: 'Ivan Petrov',
          bot: false,
          scam: false,
          premium: false,
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
        groups: [
          {
            peerId: '1',
            title: 'Alpha Chat',
            username: null,
            type: 'supergroup',
            participantsCount: null,
            region: null,
          },
        ],
        messagesPage: {
          items: [],
          page: 1,
          pageSize: 20,
          total: 2,
          hasMore: false,
        },
        stats: {
          groups: 1,
          contacts: 0,
          messages: 2,
        },
      }),
      createItem('@other', 'ambiguous', {
        queryType: 'username',
        candidates: [
          {
            telegramId: '999',
            username: 'other',
            phoneNumber: null,
            fullName: 'Other Candidate',
          },
        ],
      }),
    ]

    const { result } = renderHook(() =>
      useTgmbaseResultsViewModel({
        items,
        selectedQuery: null,
      })
    )

    act(() => {
      result.current.setSearchTerm('alpha')
      result.current.toggleStatus('found')
      result.current.toggleQueryType('telegramId')
      result.current.setPresenceFilter('hasMessages', true)
    })

    expect(result.current.visibleItems).toHaveLength(1)
    expect(result.current.visibleItems[0]?.query).toBe('123')
  })

  it('keeps the selected item when sort changes and resets selection if item is filtered out', () => {
    const items = [
      createItem('123', 'found'),
      createItem('@demo', 'ambiguous', { queryType: 'username' }),
    ]

    const { result } = renderHook(() =>
      useTgmbaseResultsViewModel({
        items,
        selectedQuery: '@demo',
      })
    )

    expect(result.current.selectedItem?.query).toBe('@demo')

    act(() => {
      result.current.setSortBy('messagesDesc')
    })

    expect(result.current.selectedItem?.query).toBe('@demo')

    act(() => {
      result.current.toggleStatus('found')
    })

    expect(result.current.visibleItems).toHaveLength(1)
    expect(result.current.selectedItem?.query).toBe('123')
  })

  it('returns an empty state when filters hide all rows', () => {
    const items = [createItem('123', 'found')]

    const { result } = renderHook(() =>
      useTgmbaseResultsViewModel({
        items,
        selectedQuery: null,
      })
    )

    act(() => {
      result.current.toggleStatus('error')
    })

    expect(result.current.visibleItems).toHaveLength(0)
    expect(result.current.selectedItem).toBeNull()
    expect(result.current.hasActiveFilters).toBe(true)
  })
})
