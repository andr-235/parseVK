import { describe, expect, it } from 'vitest'
import type { Task, TaskDetails, TasksStore } from '@/pages/tasks/store'
import { applyTaskSocketPayload, mapGatewayStatus, mergeSocketStats } from '../tasksSocketUpdate'

const createTask = (): Task => ({
  id: 10,
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  groupsCount: 4,
  title: 'Task 10',
  scope: 'SELECTED',
  mode: 'recent_posts',
  postLimit: 20,
  groupIds: [1, 2],
  stats: { groups: 4, processed: 1, comments: 3 },
})

const createStore = (): TasksStore => {
  const task = createTask()
  return {
    tasks: [task],
    taskDetails: {
      '10': { ...task, groups: [] } as TaskDetails,
    },
    taskIds: [10],
    tasksById: { '10': task },
    isLoading: false,
    isCreating: false,
    isSocketConnected: false,
  } as TasksStore
}

describe('tasks socket update helpers', () => {
  it('maps gateway status values to task statuses', () => {
    expect(mapGatewayStatus('done', false)).toBe('completed')
    expect(mapGatewayStatus('failed', true)).toBe('failed')
    expect(mapGatewayStatus('running', false)).toBe('running')
    expect(mapGatewayStatus(undefined, true)).toBe('completed')
    expect(mapGatewayStatus(undefined, false)).toBe('pending')
  })

  it('merges numeric socket stats and processed item aliases', () => {
    expect(
      mergeSocketStats(
        { groups: 4, processed: 1 },
        {
          id: 10,
          stats: { comments: 11, posts: Number.NaN },
          processedItems: '3',
        }
      )
    ).toEqual({ groups: 4, processed: 3, comments: 11 })
  })

  it('applies payload updates to list entities and cached details', () => {
    const state = createStore()

    applyTaskSocketPayload(state, {
      id: '10',
      status: 'done',
      completed: true,
      totalItems: '5',
      progress: 0.6,
      skippedGroupsMessage: null,
      scope: 'ALL',
      mode: 'recheck_group',
      postLimit: null,
      title: 'Updated task',
      completedAt: '2026-01-02T00:00:00.000Z',
      groupIds: ['3', 4],
    })

    expect(state.tasksById['10']).toMatchObject({
      status: 'completed',
      groupsCount: 5,
      skippedGroupsMessage: null,
      scope: 'ALL',
      mode: 'recheck_group',
      postLimit: null,
      title: 'Updated task',
      completedAt: '2026-01-02T00:00:00.000Z',
      stats: { groups: 4, processed: 3, comments: 3 },
    })
    expect(state.tasks[0]).toBe(state.tasksById['10'])
    expect(state.taskDetails['10']).toMatchObject({
      status: 'completed',
      scope: 'ALL',
      mode: 'recheck_group',
      postLimit: null,
      title: 'Updated task',
      completedAt: '2026-01-02T00:00:00.000Z',
      groupIds: [3, 4],
    })
  })

  it('ignores payloads for unknown task ids', () => {
    const state = createStore()

    applyTaskSocketPayload(state, { id: 404, status: 'running' })

    expect(state.tasksById).toEqual({ '10': createTask() })
    expect(state.tasks).toEqual([createTask()])
  })
})
