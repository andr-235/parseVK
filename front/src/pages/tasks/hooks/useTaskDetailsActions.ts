import { useState } from 'react'
import toast from 'react-hot-toast'
import type { TaskDetails as TaskDetailsType } from '@/shared/types'
import { useTaskDetails } from '@/pages/tasks/hooks/useTaskDetails'

export const useTaskActions = (task: TaskDetailsType | undefined) => {
  const { resumeTask, checkTask, fetchTaskDetails } = useTaskDetails()
  const [isResuming, setIsResuming] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const canResume = task?.status !== 'completed'

  const handleResume = async () => {
    if (!task || !canResume || isResuming) return
    setIsResuming(true)
    try {
      const success = await resumeTask(task.id)
      if (success) {
        void fetchTaskDetails(task.id)
        toast.success('Задача возобновлена')
      }
    } finally {
      setIsResuming(false)
    }
  }

  const handleCheck = async () => {
    if (!task || isChecking) return
    setIsChecking(true)
    try {
      const success = await checkTask(task.id)
      if (success) {
        void fetchTaskDetails(task.id)
        toast.success('Задача проверена')
      }
    } finally {
      setIsChecking(false)
    }
  }

  return { isResuming, isChecking, canResume, handleResume, handleCheck }
}
