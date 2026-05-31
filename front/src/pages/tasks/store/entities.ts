import type {
  PersistedTasksState,
  Task,
  TaskDetails,
  TaskIdentifier,
  TasksStore,
} from './tasksStore.types'
import { normalizeId, toTaskKey } from './ids'
import { isPlainObject } from './records'

export const rebuildTaskList = (ids: TaskIdentifier[], entities: Record<string, Task>): Task[] => {
  if (!Array.isArray(ids)) {
    return []
  }
  return ids.map((id) => entities[toTaskKey(id)]).filter((task): task is Task => Boolean(task))
}

export const replaceTasksCollection = (state: TasksStore, tasks: Task[]): void => {
  state.taskIds = []
  state.tasksById = {}

  tasks.forEach((task) => {
    const key = toTaskKey(task.id)
    if (!state.taskIds.some((existingId) => toTaskKey(existingId) === key)) {
      state.taskIds.push(normalizeId(task.id))
    }
    state.tasksById[key] = task
  })

  state.tasks = rebuildTaskList(state.taskIds, state.tasksById)
}

export const upsertTaskEntity = (
  state: TasksStore,
  task: Task,
  options: { position?: 'start' | 'end' } = {}
): void => {
  const key = toTaskKey(task.id)
  const normalizedId = normalizeId(task.id)
  const existingIndex = state.taskIds.findIndex((id) => toTaskKey(id) === key)

  state.tasksById[key] = task

  if (existingIndex >= 0) {
    state.taskIds[existingIndex] = normalizedId
  } else if (options.position === 'start') {
    state.taskIds.unshift(normalizedId)
  } else {
    state.taskIds.push(normalizedId)
  }

  state.tasks = rebuildTaskList(state.taskIds, state.tasksById)
}

export const deleteTaskEntity = (state: TasksStore, taskId: TaskIdentifier): void => {
  const key = toTaskKey(taskId)
  state.taskIds = state.taskIds.filter((id) => toTaskKey(id) !== key)
  delete state.tasksById[key]
  state.tasks = rebuildTaskList(state.taskIds, state.tasksById)

  if (state.taskDetails && typeof state.taskDetails === 'object') {
    delete state.taskDetails[key]
  }
}

export const ensureTaskDetailsStore = (state: TasksStore): Record<string, TaskDetails> => {
  if (!state.taskDetails || typeof state.taskDetails !== 'object') {
    state.taskDetails = {}
  }
  return state.taskDetails
}

export const mergePersistedTasksState = (
  persistedState: unknown,
  currentState: TasksStore
): TasksStore => {
  if (!persistedState) {
    return currentState
  }

  const typedState = persistedState as Partial<PersistedTasksState>
  const taskIds = Array.isArray(typedState.taskIds)
    ? typedState.taskIds
        .filter((id): id is number | string => typeof id === 'number' || typeof id === 'string')
        .map((id) => normalizeId(id))
    : []
  const tasksById = isPlainObject(typedState.tasksById)
    ? Object.fromEntries(
        Object.entries(typedState.tasksById).map(([key, value]) => [key, value as Task])
      )
    : {}

  return {
    ...currentState,
    taskIds,
    tasksById,
    tasks: rebuildTaskList(taskIds, tasksById),
  }
}
