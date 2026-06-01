import { describe, it, expect } from 'vitest'
import { ALL_STATUSES, statusColors } from '../comments'

describe('comments types', () => {
  it('ALL_STATUSES contains all statuses', () => {
    expect(ALL_STATUSES).toEqual(['Новый', 'Проверка', 'Чисто', 'Нарушение'])
  })

  it('statusColors has correct color tokens', () => {
    expect(statusColors['Чисто']).toBe('text-success')
    expect(statusColors['Нарушение']).toBe('text-danger')
    expect(statusColors['Проверка']).toBe('text-warning')
    expect(statusColors['Новый']).toBe('text-warning')
  })
})
