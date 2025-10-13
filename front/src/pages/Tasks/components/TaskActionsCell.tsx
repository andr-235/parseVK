import { useState, type MouseEvent } from 'react'

import { Button } from '../../../components/ui/button'
import { useTasksStore } from '../../../stores'
import type { Task } from '../../../types'

interface TaskActionsCellProps {
  task: Task
}

function TaskActionsCell({ task }: TaskActionsCellProps) {
  const resumeTask = useTasksStore((state) => state.resumeTask)
  const checkTask = useTasksStore((state) => state.checkTask)
  const deleteTask = useTasksStore((state) => state.deleteTask)
  const [isResuming, setIsResuming] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canResume = task.status !== 'completed'
  const disabled = isResuming || !canResume
  const checkDisabled = isChecking
  const deleteDisabled = isDeleting

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

  const handleCheck = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (checkDisabled) {
      return
    }

    setIsChecking(true)
    try {
      await checkTask(task.id)
    } finally {
      setIsChecking(false)
    }
  }

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (deleteDisabled) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteTask(task.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCheck}
        disabled={checkDisabled}
        type="button"
      >
        {isChecking ? 'Проверяем…' : 'Проверить'}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleteDisabled}
        type="button"
      >
        {isDeleting ? 'Удаляем…' : 'Удалить'}
      </Button>
    </div>
  )
}

export default TaskActionsCell
