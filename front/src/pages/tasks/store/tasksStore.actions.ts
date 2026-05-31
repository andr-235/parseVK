import type { StateCreator } from 'zustand'
import { tasksService } from '@/pages/tasks/api/tasks.api'
import { tasksQueryKeys } from '@/pages/tasks/api/queryKeys'
import { queryClient } from '@/shared/api'
import { mapResultToTaskDetails } from './tasksStore.mappers'
import { isTaskActive } from '@/pages/tasks/utils/taskProgress'
import type { TasksStore } from './tasksStore.types'
import { ensureGroupsLoaded } from './groups'
import { normalizeId, toTaskKey } from './ids'
import { deleteTaskEntity, ensureTaskDetailsStore, upsertTaskEntity } from './entities'

export type TasksStoreCreator = StateCreator<TasksStore, [['zustand/immer', never]]>

export const createTasksStore: TasksStoreCreator = (set, get) => ({
  tasks: [],
  taskDetails: {},
  taskIds: [],
  tasksById: {},
  isLoading: false,
  isCreating: false,
  isSocketConnected: false,

  fetchTasks: async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.list(),
        refetchType: 'active',
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] fetchTasks refetch error:', error)
      }
    }
  },

  createParseTask: async ({ groupIds, mode }) => {
    const validIds = groupIds.filter((value): value is number | string => {
      return (typeof value === 'number' && Number.isFinite(value)) || typeof value === 'string'
    })
    const normalizedGroupIds = Array.from(new Set(validIds.map((id) => normalizeId(id))))

    const isNumericArray = normalizedGroupIds.every(
      (value): value is number => typeof value === 'number'
    )
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
      const [, result] = await Promise.all([
        ensureGroupsLoaded(),
        tasksService.createParsingTask({ groupIds: payloadGroupIds, mode, scope: 'selected' }),
      ])

      const { task, details } = mapResultToTaskDetails(result)

      set((state) => {
        upsertTaskEntity(state, task, { position: 'start' })
        ensureTaskDetailsStore(state)[toTaskKey(task.id)] = details
      })
      void queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.list(),
        refetchType: 'active',
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
      void queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.list(),
        refetchType: 'active',
      })

      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] resumeTask error:', error)
      }
      return false
    }
  },

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
      void queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.list(),
        refetchType: 'active',
      })

      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] checkTask error:', error)
      }
      return false
    }
  },

  deleteTask: async (taskId) => {
    const normalizedId = normalizeId(taskId)

    try {
      await tasksService.deleteTask(normalizedId)

      set((state) => {
        deleteTaskEntity(state, normalizedId)
      })
      void queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.list(),
        refetchType: 'active',
      })

      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[TasksStore] deleteTask error:', error)
      }
      throw error
    }
  },

  fetchTaskDetails: async (taskId) => {
    const normalizedId = normalizeId(taskId)
    const cacheKey = toTaskKey(normalizedId)
    const cached = get().taskDetails[cacheKey]
    const shouldSkipFetch = cached && !isTaskActive(cached)
    if (shouldSkipFetch) {
      return cached
    }

    try {
      const [, result] = await Promise.all([
        ensureGroupsLoaded(),
        tasksService.fetchTaskDetails(normalizedId),
      ])

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

  getTaskDetails: (taskId) => {
    return get().taskDetails[toTaskKey(taskId)]
  },
})
