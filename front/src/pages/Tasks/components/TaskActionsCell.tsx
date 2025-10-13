import { useState, type MouseEvent } from 'react'

import { Button } from '../../../components/ui/button'
import { useTasksStore } from '../../../stores'
import type { Task } from '../../../types'

interface TaskActionsCellProps {
  task: Task
}

function TaskActionsCell({ task }: TaskActionsCellProps) {
  const resumeTask = useTasksStore((state) => state.resumeTask)
  const [isResuming, setIsResuming] = useState(false)

  const canResume = task.status !== 'completed'
  const disabled = isResuming || !canResume

  const handleResume = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (disabled) {
      return
    }

    setIsResuming(true)
    try {
      await resumeTask(task.id)
    } finally {
      setIsResuming(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResume}
      disabled={disabled}
      type="button"
      title={!canResume ? 'Задача завершена' : undefined}
    >
      {isResuming ? 'Возобновление…' : 'Продолжить'}
    </Button>
  )
}

export default TaskActionsCell
