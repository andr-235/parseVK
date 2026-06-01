import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export type ConfirmActionProps = {
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  showIcon?: boolean
}

export function ConfirmAction({
  onConfirm,
  onCancel,
  isLoading,
  message = 'Удалить?',
  confirmLabel = 'Да',
  cancelLabel = 'Отмена',
  loadingLabel = '...',
  showIcon = false,
}: ConfirmActionProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {showIcon && <AlertTriangle size={12} className="text-danger" />}
      <span className={showIcon ? 'text-text-secondary' : 'text-danger font-medium'}>
        {message}
      </span>
      <Button variant="primary" size="xs" semantic="danger" onClick={onConfirm} disabled={isLoading}>
        {isLoading ? loadingLabel : confirmLabel}
      </Button>
      <Button variant="secondary" size="xs" onClick={onCancel} disabled={isLoading}>
        {cancelLabel}
      </Button>
    </div>
  )
}
