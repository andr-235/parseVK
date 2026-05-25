import { describe, expect, it } from 'vitest'
import { formatNumber, declOfNumber } from '../numberFormat'

describe('numberFormat utility', () => {
  describe('formatNumber', () => {
    it('formats positive integers correctly', () => {
      expect(formatNumber(1000)).toBe('1 000') // non-breaking space used by Intl in ru-RU
      expect(formatNumber(0)).toBe('0')
    })

    it('rounds float values', () => {
      expect(formatNumber(10.6)).toBe('11')
      expect(formatNumber(10.4)).toBe('10')
    })

    it('prevents negative values by returning 0', () => {
      expect(formatNumber(-100)).toBe('0')
    })
  })

  describe('declOfNumber', () => {
    const titles: [string, string, string] = ['группа', 'группы', 'групп']

    it('returns singular form for 1, 21, 31...', () => {
      expect(declOfNumber(1, titles)).toBe('группа')
      expect(declOfNumber(21, titles)).toBe('группа')
      expect(declOfNumber(101, titles)).toBe('группа')
    })

    it('returns dual form for 2, 3, 4, 22, 23, 24...', () => {
      expect(declOfNumber(2, titles)).toBe('группы')
      expect(declOfNumber(3, titles)).toBe('группы')
      expect(declOfNumber(4, titles)).toBe('группы')
      expect(declOfNumber(22, titles)).toBe('группы')
      expect(declOfNumber(104, titles)).toBe('группы')
    })

    it('returns plural form for 0, 5-20, 25-30, 111-114...', () => {
      expect(declOfNumber(0, titles)).toBe('групп')
      expect(declOfNumber(5, titles)).toBe('групп')
      expect(declOfNumber(11, titles)).toBe('групп')
      expect(declOfNumber(12, titles)).toBe('групп')
      expect(declOfNumber(13, titles)).toBe('групп')
      expect(declOfNumber(14, titles)).toBe('групп')
      expect(declOfNumber(20, titles)).toBe('групп')
      expect(declOfNumber(25, titles)).toBe('групп')
      expect(declOfNumber(112, titles)).toBe('групп')
    })
  })
})
