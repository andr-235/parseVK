import { describe, expect, it } from 'vitest'
import { getCommentCategories } from '../getCommentCategories'

describe('getCommentCategories', () => {
  it('returns unique non-empty categories from matched keywords', () => {
    const categories = getCommentCategories([
      { id: 1, word: 'ремонт', category: 'Услуги' },
      { id: 2, word: 'мастер', category: 'Услуги' },
      { id: 3, word: 'скидка', category: 'Акции' },
      { id: 4, word: 'без тега', category: null },
    ])

    expect(categories).toEqual(['Услуги', 'Акции'])
  })
})
