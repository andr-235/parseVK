import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { relativeTime, formatDateTime } from '../time'

describe('time utilities', () => {
  describe('relativeTime', () => {
    const mockNow = new Date('2026-06-07T12:00:00Z').getTime()

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(mockNow)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns "только что" for times less than 10 seconds ago', () => {
      const past = new Date(mockNow - 5 * 1000)
      expect(relativeTime(past)).toBe('только что')
    })

    it('returns seconds ago format for times under a minute ago', () => {
      const past = new Date(mockNow - 45 * 1000)
      expect(relativeTime(past)).toBe('45 секунд назад')
    })

    it('correctly plurals Russian nouns for seconds', () => {
      expect(relativeTime(new Date(mockNow - 21 * 1000))).toBe('21 секунда назад')
      expect(relativeTime(new Date(mockNow - 22 * 1000))).toBe('22 секунды назад')
      expect(relativeTime(new Date(mockNow - 25 * 1000))).toBe('25 секунд назад')
    })

    it('returns minutes ago format correctly', () => {
      expect(relativeTime(new Date(mockNow - 1 * 60 * 1000))).toBe('1 минута назад')
      expect(relativeTime(new Date(mockNow - 2 * 60 * 1000))).toBe('2 минуты назад')
      expect(relativeTime(new Date(mockNow - 5 * 60 * 1000))).toBe('5 минут назад')
    })

    it('returns hours ago format correctly', () => {
      expect(relativeTime(new Date(mockNow - 1 * 3600 * 1000))).toBe('1 час назад')
      expect(relativeTime(new Date(mockNow - 3 * 3600 * 1000))).toBe('3 часа назад')
      expect(relativeTime(new Date(mockNow - 5 * 3600 * 1000))).toBe('5 часов назад')
    })

    it('returns days ago format correctly', () => {
      expect(relativeTime(new Date(mockNow - 1 * 86400 * 1000))).toBe('1 день назад')
      expect(relativeTime(new Date(mockNow - 4 * 86400 * 1000))).toBe('4 дня назад')
      expect(relativeTime(new Date(mockNow - 6 * 86400 * 1000))).toBe('6 дней назад')
    })

    it('returns weeks ago format correctly', () => {
      expect(relativeTime(new Date(mockNow - 7 * 86400 * 1000))).toBe('1 неделя назад')
      expect(relativeTime(new Date(mockNow - 10 * 86400 * 1000))).toBe('1 неделя назад')
      expect(relativeTime(new Date(mockNow - 14 * 86400 * 1000))).toBe('2 недели назад')
    })

    it('returns months ago format correctly', () => {
      expect(relativeTime(new Date(mockNow - 30 * 86400 * 1000))).toBe('1 месяц назад')
      expect(relativeTime(new Date(mockNow - 90 * 86400 * 1000))).toBe('3 месяца назад')
    })

    it('returns years ago format correctly', () => {
      expect(relativeTime(new Date(mockNow - 365 * 86400 * 1000))).toBe('1 год назад')
      expect(relativeTime(new Date(mockNow - 730 * 86400 * 1000))).toBe('2 года назад')
      expect(relativeTime(new Date(mockNow - 5 * 365 * 86400 * 1000))).toBe('5 лет назад')
    })
  })

  describe('formatDateTime', () => {
    it('returns dash for null or empty dates', () => {
      expect(formatDateTime(null)).toBe('—')
    })

    it('returns dash for empty string', () => {
      expect(formatDateTime('')).toBe('—')
    })

    it('formats date correctly in Russian locale format', () => {
      const date = new Date('2026-06-07T12:30:00Z')
      const expected = date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      expect(formatDateTime(date)).toBe(expected)
    })
  })
})
