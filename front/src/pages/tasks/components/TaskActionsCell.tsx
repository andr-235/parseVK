import { useState, type MouseEvent } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/shared/components/ui/button'
import { useTaskActions } from '@/pages/tasks/hooks/useTaskActions'
import type { Task } from '@/shared/types'
import { ConfirmDialog } from './ConfirmDialog'

interface TaskActionsCellProps {
  task: Task
}

function TaskActionsCell({ task }: TaskActionsCellProps) {
  const { resumeTask, checkTask, deleteTask } = useTaskActions()
  const [isResuming, setIsResuming] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const canResume = task.status === 'failed'
  const disabled = isResuming || !canResume
  const checkDisabled = isChecking
  const deleteDisabled = isDeleting
  const resumeTitle = (() => {
    if (canResume) {
      return undefined
    }

    if (task.status === 'completed') {
      return 'Задача завершена'
    }

    if (task.status === 'running' || task.status === 'processing') {
      return 'Задача уже выполняется'
    }

    if (task.status === 'pending') {
      return 'Задача уже ожидает запуска'
    }

    return undefined
  })()

  const handleResume = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (disabled) {
      return
    }

    setIsResuming(true)
    try {
      await resumeTask(task.id)
      toast.success('Задача возобновлена')
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
      toast.success('Задача проверена')
    } finally {
      setIsChecking(false)
    }
  }

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (deleteDisabled) {
      return
    }

    setShowConfirm(true)
  }

  const handleConfirmDelete = async () => {
    setShowConfirm(false)
    setIsDeleting(true)
    try {
      await deleteTask(task.id)
    } catch {
      // toast об ошибке уже показывается в tasks.api.ts
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
        title={resumeTitle}
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

      <ConfirmDialog
        open={showConfirm}
        title="Удалить задачу?"
        message="Это действие необратимо."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}

export default TaskActionsCell
