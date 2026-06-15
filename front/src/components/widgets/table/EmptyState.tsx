import type { ReactNode } from 'react'
import { MessageSquareOff } from 'lucide-react'
import { Button } from '../../ui'

export type EmptyStateProps = {
  onReset?: () => void
  icon?: ReactNode
  message?: string
  action?: ReactNode
}

export function EmptyState({ onReset, icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-bg-main p-8 text-center">
      {icon ?? <MessageSquareOff size={32} className="text-text-muted" />}
      <p className="text-sm text-text-secondary">{message ?? 'Ничего не найдено'}</p>
      {action}
      {!action && onReset && (
        <Button variant="link" size="sm" semantic="default" onClick={onReset}>
          Сбросить фильтры
        </Button>
      )}
    </div>
  )
}
