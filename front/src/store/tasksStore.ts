import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { PersistOptions } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { tasksService } from '../services/tasksService'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../hooks/queryKeys'
import { mapResultToTaskDetails } from './tasksStore.mappers'
import {
  ensureGroupsLoaded,
  ensureTaskDetailsStore,
  isPlainObject,
  normalizeId,
  rebuildTaskList,
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
  isSocketConnected: false,

  /**
   * Загружает список задач и синхронизирует нормализованное состояние.
   */
  fetchTasks: async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasks,
        refetchType: 'active'
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] fetchTasks refetch error:', error)
      }
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks, refetchType: 'active' })

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
   * Возобновляет остановленную задачу и обновляет локальный кэш.
   */
  resumeTask: async (taskId) => {
    const normalizedId = normalizeId(taskId)

    try {
      const result = await tasksService.resumeTask(normalizedId)
      const { task, details } = mapResultToTaskDetails(result)

      set((state) => {
        const taskKey = toTaskKey(task.id)
        const exists = Boolean(state.tasksById[taskKey])
        upsertTaskEntity(state, task, exists ? {} : { position: 'start' })
        ensureTaskDetailsStore(state)[taskKey] = details
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks, refetchType: 'active' })

      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] resumeTask error:', error)
      }
      return false
    }
  },

  /**
   * Проверяет состояние задачи и при необходимости повторно ставит её в очередь.
   */
  checkTask: async (taskId) => {
    const normalizedId = normalizeId(taskId)

    try {
      const result = await tasksService.checkTask(normalizedId)
      const { task, details } = mapResultToTaskDetails(result)

      set((state) => {
        const taskKey = toTaskKey(task.id)
        const exists = Boolean(state.tasksById[taskKey])
        upsertTaskEntity(state, task, exists ? {} : { position: 'start' })
        ensureTaskDetailsStore(state)[taskKey] = details
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks, refetchType: 'active' })

      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] checkTask error:', error)
      }
      return false
    }
  },

  /**
   * Удаляет задачу и очищает локальное состояние.
   */
  deleteTask: async (taskId) => {
    const normalizedId = normalizeId(taskId)

    try {
      await tasksService.deleteTask(normalizedId)

      set((state) => {
        const key = toTaskKey(normalizedId)
        state.taskIds = state.taskIds.filter((id) => toTaskKey(id) !== key)
        delete state.tasksById[key]
        state.tasks = rebuildTaskList(state.taskIds, state.tasksById)

        if (state.taskDetails && typeof state.taskDetails === 'object') {
          delete state.taskDetails[key]
        }
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks, refetchType: 'active' })

      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] deleteTask error:', error)
      }
      return false
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
