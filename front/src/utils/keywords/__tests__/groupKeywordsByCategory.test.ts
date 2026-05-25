import { describe, expect, it } from 'vitest'
import { groupKeywordsByCategory } from '../groupKeywordsByCategory'

describe('groupKeywordsByCategory', () => {
  it('groups keywords by category and keeps uncategorized items in fallback bucket', () => {
    const groups = groupKeywordsByCategory([
      { id: 1, word: 'ремонт', category: 'Услуги' },
      { id: 2, word: 'сантехник', category: 'Услуги' },
      { id: 3, word: 'скидка', category: null },
    ])

    expect(groups.map((group) => group.category)).toEqual(['Услуги', 'Без категории'])
    expect(groups[0].keywords).toHaveLength(2)
    expect(groups[1].keywords).toHaveLength(1)
  })

  it('normalizes blank categories to fallback bucket', () => {
    const groups = groupKeywordsByCategory([
      { id: 1, word: 'куплю', category: '  ' },
      { id: 2, word: 'продам', category: '' },
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].category).toBe('Без категории')
  })
})
