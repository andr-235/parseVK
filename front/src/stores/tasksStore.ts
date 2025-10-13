import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { PersistOptions } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { tasksService } from '../services/tasksService'
import { mapResultToTaskDetails, mapSummaryToTask } from './tasksStore.mappers'
import {
  ensureGroupsLoaded,
  ensureTaskDetailsStore,
  isPlainObject,
  normalizeId,
  rebuildTaskList,
  replaceTasksCollection,
  toTaskKey,
  upsertTaskEntity
} from './tasksStore.utils'
import { isTaskActive } from '../utils/taskProgress'
import type { PersistedTasksState, Task, TaskIdentifier, TaskStatus, TasksStore } from './tasksStore.types'

const persistOptions: PersistOptions<TasksStore, PersistedTasksState> = {
  name: 'tasks-store',
  version: 1,
  partialize: (state) => ({
    taskIds: state.taskIds,
    tasksById: state.tasksById
  }),
  merge: (persistedState, currentState) => {
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
      tasks: rebuildTaskList(taskIds, tasksById)
    }
  }
}

type TasksStoreCreator = StateCreator<TasksStore, [['zustand/immer', never]]>


const createTasksStore: TasksStoreCreator = (set, get) => ({
  tasks: [],
  taskDetails: {},
  taskIds: [],
  tasksById: {},
  isLoading: false,
  isCreating: false,

  /**
   * Загружает список задач и синхронизирует нормализованное состояние.
   */
  fetchTasks: async () => {
    set((state) => {
      state.isLoading = true
    })

    try {
      const summaries = await tasksService.fetchTasks()

      const mappedTasks = summaries.map((item, index) => {
        const mapped = mapSummaryToTask(item)

        if (import.meta.env.DEV) {
          console.debug('[TasksStore] mapped summary', index, { input: item, output: mapped })
        }

        return mapped
      })

      set((state) => {
        state.isLoading = false
        replaceTasksCollection(state, mappedTasks)
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] fetchTasks error:', error)
      }
      set((state) => {
        state.isLoading = false
      })
    }
  },

  /**
   * Создаёт новую задачу на парсинг и добавляет её в начало списка.
   */
  createParseTask: async (groupIds) => {
    const validIds = groupIds.filter((value): value is number | string => {
      return (typeof value === 'number' && Number.isFinite(value)) || typeof value === 'string'
    })
    const normalizedGroupIds = Array.from(new Set(validIds.map((id) => normalizeId(id))))

    const isNumericArray = normalizedGroupIds.every((value): value is number => typeof value === 'number')
    const payloadGroupIds: string[] | number[] = isNumericArray
      ? normalizedGroupIds
      : normalizedGroupIds.map((value) => String(value))

    if (payloadGroupIds.length === 0) {
      return null
    }

    set((state) => {
      state.isCreating = true
    })

    try {
      await ensureGroupsLoaded()
      const result = await tasksService.createParsingTask({ groupIds: payloadGroupIds })

      const { task, details } = mapResultToTaskDetails(result)

      set((state) => {
        upsertTaskEntity(state, task, { position: 'start' })
        ensureTaskDetailsStore(state)[toTaskKey(task.id)] = details
      })

      return task.id
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] createParseTask error:', error)
      }
      return null
    } finally {
      set((state) => {
        state.isCreating = false
      })
    }
  },

  /**
   * Загружает детали задачи и кэширует результат.
   */
  fetchTaskDetails: async (taskId) => {
    await ensureGroupsLoaded()

    const normalizedId = normalizeId(taskId)
    const cacheKey = toTaskKey(normalizedId)
    const cached = get().taskDetails[cacheKey]
    const shouldSkipFetch = cached && !isTaskActive(cached)
    if (shouldSkipFetch) {
      return cached
    }

    try {
      const result = await tasksService.fetchTaskDetails(normalizedId)

      const { task, details } = mapResultToTaskDetails(result)
      const exists = Boolean(get().tasksById[toTaskKey(task.id)])

      set((state) => {
        upsertTaskEntity(state, task, exists ? {} : { position: 'start' })
        ensureTaskDetailsStore(state)[toTaskKey(task.id)] = details
      })

      return details
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] fetchTaskDetails error:', error)
      }
      return cached ?? null
    }
  },

  /**
   * Возвращает кэшированные детали задачи без дополнительных запросов.
   */
  getTaskDetails: (taskId) => {
    return get().taskDetails[toTaskKey(taskId)]
  }
})

export const useTasksStore = create<
  TasksStore,
  [
    ['zustand/subscribeWithSelector', never],
    ['zustand/devtools', Record<string, unknown>],
    ['zustand/persist', PersistedTasksState],
    ['zustand/immer', never]
  ]
>(
  subscribeWithSelector(
    devtools(
      persist(immer(createTasksStore), persistOptions),
      { name: 'TasksStore' }
    )
  )
)

/**
 * Селектор для получения массива идентификаторов задач.
 */
export const selectTaskIds = (state: TasksStore): TaskIdentifier[] => state.taskIds

/**
 * Селектор для получения словаря задач.
 */
export const selectTaskEntities = (state: TasksStore): Record<string, Task> => state.tasksById

/**
 * Селектор для получения списка задач в порядке отображения.
 */
export const selectTaskList = (state: TasksStore): Task[] => state.tasks

/**
 * Создаёт селектор для получения задачи по идентификатору.
 */
export const selectTaskById = (taskId: TaskIdentifier) => (state: TasksStore): Task | undefined => {
  return state.tasksById[toTaskKey(taskId)]
}

/**
 * Создаёт селектор для получения статуса конкретной задачи.
 */
export const selectTaskStatus = (taskId: TaskIdentifier) => (
  state: TasksStore
): TaskStatus | undefined => {
  return state.tasksById[toTaskKey(taskId)]?.status
}

/**
 * Пример точечной подписки на изменение статуса задачи.
 */
export const subscribeToTaskStatus = (
  taskId: TaskIdentifier,
  listener: (status: TaskStatus | undefined, previousStatus: TaskStatus | undefined) => void
) => {
  return useTasksStore.subscribe(selectTaskStatus(taskId), listener)
}
