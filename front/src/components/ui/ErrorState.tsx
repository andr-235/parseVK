import { ShieldAlert, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { formatError } from '../../shared/utils/error'

export type ErrorStateProps = {
  error: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <ShieldAlert size={24} className="text-danger" />
      <p className="text-sm text-danger">{formatError(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RotateCcw size={14} />}>
          Попробовать снова
        </Button>
      )}
    </div>
  )
}
