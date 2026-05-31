import type { Task, TaskIdentifier, TaskStatus, TasksStore } from './tasksStore.types'
import { toTaskKey } from './ids'
import { useTasksStore } from './tasksStore'

export const selectTaskIds = (state: TasksStore): TaskIdentifier[] => state.taskIds

export const selectTaskEntities = (state: TasksStore): Record<string, Task> => state.tasksById

export const selectTaskList = (state: TasksStore): Task[] => state.tasks

export const selectTaskById =
  (taskId: TaskIdentifier) =>
  (state: TasksStore): Task | undefined => {
    return state.tasksById[toTaskKey(taskId)]
  }

export const selectTaskStatus =
  (taskId: TaskIdentifier) =>
  (state: TasksStore): TaskStatus | undefined => {
    return state.tasksById[toTaskKey(taskId)]?.status
  }

export const subscribeToTaskStatus = (
  taskId: TaskIdentifier,
  listener: (status: TaskStatus | undefined, previousStatus: TaskStatus | undefined) => void
) => {
  return useTasksStore.subscribe(selectTaskStatus(taskId), listener)
}
