import { MessageSquareOff } from 'lucide-react'
import { Button } from '../../../ui'

export type EmptyStateProps = {
  onReset: () => void
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-bg-main p-8 text-center">
      <MessageSquareOff size={32} className="text-text-muted" />
      <p className="text-sm text-text-secondary">Ничего не найдено</p>
      <Button variant="link" size="sm" semantic="default" onClick={onReset}>Сбросить фильтры</Button>
    </div>
  )
}
