import { useTasksStore } from '@/modules/tasks/store'

export function useTaskActions() {
  const resumeTask = useTasksStore((state) => state.resumeTask)
  const checkTask = useTasksStore((state) => state.checkTask)
  const deleteTask = useTasksStore((state) => state.deleteTask)

  return {
    resumeTask,
    checkTask,
    deleteTask,
  }
}
