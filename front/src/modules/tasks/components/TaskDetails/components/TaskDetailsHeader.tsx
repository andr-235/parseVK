import { X } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface TaskDetailsHeaderProps {
  taskId: number | string
  isResuming: boolean
  isChecking: boolean
  canResume: boolean
  onResume: () => void
  onCheck: () => void
  onClose: () => void
}

export const TaskDetailsHeader = ({
  taskId,
  isResuming,
  isChecking,
  canResume,
  onResume,
  onCheck,
  onClose,
}: TaskDetailsHeaderProps) => {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/60 px-8 py-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Детали задачи #{taskId}</h2>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={isResuming || !canResume}
          onClick={onResume}
          title={canResume ? undefined : 'Завершённую задачу возобновлять не требуется'}
        >
          {isResuming ? 'Возобновление…' : 'Продолжить'}
        </Button>
        <Button variant="ghost" onClick={onCheck} disabled={isChecking}>
          {isChecking ? 'Проверяем…' : 'Проверить'}
        </Button>
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </header>
  )
}
