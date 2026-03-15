import { describe, expect, it } from 'vitest'
import { mapSummaryToTask } from './mapSummaryToTask'

describe('mapSummaryToTask', () => {
  it('сохраняет режим перепроверки и null postLimit', () => {
    const task = mapSummaryToTask({
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
    })

    expect(task.mode).toBe('recheck_group')
    expect(task.postLimit).toBeNull()
  })
})
