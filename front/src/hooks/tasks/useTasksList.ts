import { useShallow } from 'zustand/react/shallow'
import { useTasksStore } from '@/store/tasks'

export const useTasksList = () => {
  const { tasks, isLoading } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
      isLoading: state.isLoading,
    }))
  )

  return {
    tasks,
    isLoading,
  }
}
