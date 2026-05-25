import { describe, expect, it } from 'vitest'
import { mergeListsById } from '../listUtils'

describe('listUtils utility', () => {
  describe('mergeListsById', () => {
    it('merges arrays without duplicate IDs, prioritizing incoming elements', () => {
      const incoming = [
        { id: 1, name: 'Alice (updated)' },
        { id: 2, name: 'Bob' },
      ]
      const existing = [
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' },
      ]

      const result = mergeListsById(incoming, existing)

      expect(result).toEqual([
        { id: 1, name: 'Alice (updated)' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ])
    })

    it('works with custom keys', () => {
      const incoming = [
        { key: 'a', val: 1 },
        { key: 'b', val: 2 },
      ]
      const existing = [
        { key: 'a', val: 0 },
        { key: 'c', val: 3 },
      ]

      const result = mergeListsById(incoming, existing, 'key')

      expect(result).toEqual([
        { key: 'a', val: 1 },
        { key: 'b', val: 2 },
        { key: 'c', val: 3 },
      ])
    })

    it('handles empty lists', () => {
      expect(mergeListsById([], [])).toEqual([])
      expect(mergeListsById([{ id: 1 }], [])).toEqual([{ id: 1 }])
      expect(mergeListsById([], [{ id: 1 }])).toEqual([{ id: 1 }])
    })
  })
})
