import { useShallow } from 'zustand/react/shallow'
import { useTasksStore } from '@/store'

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
