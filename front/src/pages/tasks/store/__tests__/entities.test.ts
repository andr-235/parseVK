import { describe, expect, it } from 'vitest'
import type { Task, TaskDetails, TasksStore } from '@/pages/tasks/store'
import {
  deleteTaskEntity,
  mergePersistedTasksState,
  replaceTasksCollection,
  upsertTaskEntity,
} from '../entities'

const createTask = (id: number | string, status: Task['status'] = 'pending'): Task => ({
  id,
  status,
  createdAt: '2026-01-01T00:00:00.000Z',
  groupsCount: 1,
  title: `Task ${id}`,
  scope: 'SELECTED',
  mode: 'recent_posts',
  postLimit: null,
  groupIds: [1],
  stats: { groups: 1 },
})

const createStore = (): TasksStore =>
  ({
    tasks: [],
    taskDetails: {},
    taskIds: [],
    tasksById: {},
    isLoading: false,
    isCreating: false,
    isSocketConnected: false,
  }) as TasksStore

describe('tasks entity helpers', () => {
  it('replaces a collection with normalized ids and ordered entities', () => {
    const state = createStore()
    const first = createTask('1')
    const second = createTask(2)

    replaceTasksCollection(state, [first, second])

    expect(state.taskIds).toEqual([1, 2])
    expect(state.tasksById).toEqual({ '1': first, '2': second })
    expect(state.tasks).toEqual([first, second])
  })

  it('upserts existing tasks in place and can insert new tasks at the start', () => {
    const state = createStore()
    const first = createTask(1)
    const second = createTask(2)
    replaceTasksCollection(state, [first])

    upsertTaskEntity(state, second, { position: 'start' })
    upsertTaskEntity(state, createTask('1', 'running'))

    expect(state.taskIds).toEqual([2, 1])
    expect(state.tasks.map((task) => [task.id, task.status])).toEqual([
      [2, 'pending'],
      ['1', 'running'],
    ])
  })

  it('deletes a task and cleans cached details for the same normalized id', () => {
    const state = createStore()
    const task = createTask(1)
    replaceTasksCollection(state, [task])
    state.taskDetails = {
      '1': { ...task, groups: [] } as TaskDetails,
    }

    deleteTaskEntity(state, '1')

    expect(state.taskIds).toEqual([])
    expect(state.tasksById).toEqual({})
    expect(state.tasks).toEqual([])
    expect(state.taskDetails).toEqual({})
  })

  it('merges persisted data defensively and ignores invalid persisted shapes', () => {
    const current = createStore()
    const task = createTask(7)

    const merged = mergePersistedTasksState(
      {
        taskIds: ['7', {}, null],
        tasksById: { '7': task },
      },
      current
    )

    expect(merged.taskIds).toEqual([7])
    expect(merged.tasksById).toEqual({ '7': task })
    expect(merged.tasks).toEqual([task])

    expect(mergePersistedTasksState({ taskIds: {}, tasksById: [] }, current)).toMatchObject({
      taskIds: [],
      tasksById: {},
      tasks: [],
    })
  })
})
