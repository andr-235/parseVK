import { describe, expect, it } from 'vitest'
import { mapResultToTaskDetails } from './mapResultToTaskDetails'

describe('mapResultToTaskDetails', () => {
  it('протягивает режим перепроверки в task и details', () => {
    const result = mapResultToTaskDetails({
      id: 1,
      createdAt: '2026-03-16T00:00:00.000Z',
      status: 'running',
      title: 'Перепроверка группы: Test',
      mode: 'recheck_group',
      postLimit: null,
      scope: 'selected',
      groupIds: [1],
      totalItems: 1,
      processedItems: 0,
      progress: 0,
      groups: [],
    })

    expect(result.task.mode).toBe('recheck_group')
    expect(result.task.postLimit).toBeNull()
    expect(result.details.mode).toBe('recheck_group')
    expect(result.details.postLimit).toBeNull()
  })
})
