import { useEffect, useRef } from 'react'
import { Button } from '@/shared/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmText = 'Удалить', cancelText = 'Отмена', onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background-primary/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background-secondary/95 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-danger to-transparent" />

        <div className="px-6 pt-6 pb-4">
          <h2 className="font-monitoring-display text-lg font-semibold text-text-light">{title}</h2>
          <p className="mt-2 text-sm font-normal text-text-secondary font-monitoring-body">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-background-sidebar/30 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 border-border bg-transparent text-text-secondary hover:bg-background-primary hover:text-text-light transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="h-10 bg-accent-danger text-text-light hover:bg-accent-danger/90 transition-colors min-w-[100px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
