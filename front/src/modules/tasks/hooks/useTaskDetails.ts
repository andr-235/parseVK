import { useShallow } from 'zustand/react/shallow'
import { useTasksStore } from '@/store'

export const useTaskDetails = () => {
  const { resumeTask, checkTask, fetchTaskDetails } = useTasksStore(
    useShallow((state) => ({
      resumeTask: state.resumeTask,
      checkTask: state.checkTask,
      fetchTaskDetails: state.fetchTaskDetails,
    }))
  )

  return {
    resumeTask,
    checkTask,
    fetchTaskDetails,
  }
}
