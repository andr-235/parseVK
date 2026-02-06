import { useState } from 'react'
import { useTaskDetails } from '@/modules/tasks/hooks/useTaskDetails'
import type { TaskDetails as TaskDetailsType } from '@/types'

export const useTaskActions = (task: TaskDetailsType | undefined) => {
  const { resumeTask, checkTask, fetchTaskDetails } = useTaskDetails()
  const [isResuming, setIsResuming] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const canResume = task?.status !== 'completed'

  const handleResume = async () => {
    if (!task || !canResume || isResuming) {
      return
    }

    setIsResuming(true)
    try {
      const success = await resumeTask(task.id)
      if (success) {
        void fetchTaskDetails(task.id)
      }
    } finally {
      setIsResuming(false)
    }
  }

  const handleCheck = async () => {
    if (!task || isChecking) {
      return
    }

    setIsChecking(true)
    try {
      const success = await checkTask(task.id)
      if (success) {
        void fetchTaskDetails(task.id)
      }
    } finally {
      setIsChecking(false)
    }
  }

  return {
    isResuming,
    isChecking,
    canResume,
    handleResume,
    handleCheck,
  }
}
