import { Check, X } from 'lucide-react'
import { Button } from './Button'
import type { Feedback } from '../../shared/hooks/useFeedback'

export type FeedbackToastProps = {
  feedback: Feedback
  onDismiss?: () => void
}

export function FeedbackToast({ feedback, onDismiss }: FeedbackToastProps) {
  if (!feedback) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
        feedback.type === 'success'
          ? 'border-success bg-success-soft text-success'
          : 'border-danger bg-danger-soft text-danger'
      }`}
    >
      {feedback.type === 'success' ? <Check size={12} /> : <X size={12} />}
      <span className="flex-1">{feedback.text}</span>
      {onDismiss && (
        <Button variant="ghost" size="xs" semantic="default" onClick={onDismiss} className="-my-1 -mr-1" aria-label="Закрыть">
          <X size={12} />
        </Button>
      )}
    </div>
  )
}
