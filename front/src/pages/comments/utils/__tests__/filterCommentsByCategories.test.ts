import { describe, expect, it } from 'vitest'
import { filterCommentsByCategories } from '../filterCommentsByCategories'

describe('filterCommentsByCategories', () => {
  it('keeps comment when at least one selected category matches', () => {
    const result = filterCommentsByCategories(
      [
        { comment: { id: 1 }, categories: ['Услуги'] },
        { comment: { id: 2 }, categories: ['Акции'] },
        { comment: { id: 3 }, categories: [] },
      ],
      ['Акции', 'Срочно']
    )

    expect(result.map((item) => item.comment.id)).toEqual([2])
  })

  it('returns all items when no category filter selected', () => {
    const items = [
      { comment: { id: 1 }, categories: ['Услуги'] },
      { comment: { id: 2 }, categories: [] },
    ]

    expect(filterCommentsByCategories(items, [])).toEqual(items)
  })
})
