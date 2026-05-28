import { type ReactNode, type FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/common'

export interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  description?: string
  icon?: ReactNode
  isSaving?: boolean
  onSubmit?: (e: FormEvent) => void | Promise<void>
  error?: string | null
  children: ReactNode
  submitText?: string
  cancelText?: string
  widthClass?: string // e.g. "max-w-xl", "max-w-md", "max-w-3xl"
}

export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  isSaving = false,
  onSubmit,
  error,
  children,
  submitText = 'Сохранить',
  cancelText = 'Отмена',
  widthClass = 'max-w-xl',
}: FormModalProps) {
  // Блокировка прокрутки body при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    if (isSaving) return
    onClose()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(e)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={cn(
          'relative my-8 w-full overflow-hidden rounded-2xl border border-border bg-background-secondary/95 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200',
          widthClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow accent line in style of DESIGN.md */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background-primary text-accent-primary">
                {icon}
              </div>
            )}
            <div>
              <h2 className="font-monitoring-display text-lg font-semibold text-text-light">
                {title}
              </h2>
              {description && (
                <p className="text-xs text-text-secondary font-monitoring-body">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-text-secondary transition-all hover:bg-background-primary hover:text-text-light text-lg font-bold leading-none disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Form Container */}
        {onSubmit ? (
          <form onSubmit={handleSubmit}>
            <div className="px-6 pb-4 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>

            {error && (
              <div className="px-6 pb-2">
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg border border-destructive/20 font-monitoring-body">
                  {error}
                </p>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-background-sidebar/30 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
                className="h-10 border-border bg-transparent text-text-secondary hover:bg-background-primary hover:text-text-light transition-all"
              >
                {cancelText}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 transition-all min-w-[100px]"
              >
                {isSaving ? <Spinner className="size-4 mr-2" /> : null}
                {submitText}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="px-6 pb-6 space-y-4 max-h-[75vh] overflow-y-auto">{children}</div>

            {error && (
              <div className="px-6 pb-4">
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg border border-destructive/20 font-monitoring-body">
                  {error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
