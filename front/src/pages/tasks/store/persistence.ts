import type { PersistOptions } from 'zustand/middleware'
import type { PersistedTasksState, TasksStore } from './tasksStore.types'
import { mergePersistedTasksState } from './entities'

export const persistOptions: PersistOptions<TasksStore, PersistedTasksState> = {
  name: 'tasks-store',
  version: 1,
  partialize: (state) => ({
    taskIds: state.taskIds,
    tasksById: state.tasksById,
  }),
  merge: mergePersistedTasksState,
}
