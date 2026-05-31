import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import type { PersistedTasksState, TasksStore } from './tasksStore.types'
import { createTasksStore } from './tasksStore.actions'
import { persistOptions } from './persistence'

export const useTasksStore = create<
  TasksStore,
  [
    ['zustand/subscribeWithSelector', never],
    ['zustand/devtools', Record<string, unknown>],
    ['zustand/persist', PersistedTasksState],
    ['zustand/immer', never],
  ]
>(
  subscribeWithSelector(
    devtools(persist(immer(createTasksStore), persistOptions), { name: 'TasksStore' })
  )
)

export {
  selectTaskById,
  selectTaskEntities,
  selectTaskIds,
  selectTaskList,
  selectTaskStatus,
  subscribeToTaskStatus,
} from './selectors'
