import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils'

interface TaskModalShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
  bodyClassName?: string
}

function TaskModalShell({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  widthClass = 'max-w-5xl',
  bodyClassName,
}: TaskModalShellProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background-primary/80" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-card border border-border/70 bg-background-secondary shadow-soft-md outline-none',
            widthClass
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              {icon ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background-primary text-accent-primary">
                  {icon}
                </div>
              ) : null}
              <div className="min-w-0">
                <Dialog.Title className="font-monitoring-display text-lg font-semibold text-text-light">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1 font-monitoring-body text-sm text-text-secondary">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
            </div>
            <Dialog.Close
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-text-secondary outline-none hover:border-border/70 hover:bg-background-primary hover:text-text-light focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              aria-label="Закрыть"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5', bodyClassName)}>
            {children}
          </div>

          {footer ? (
            <div className="border-t border-border/60 bg-background-secondary px-5 py-4">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default TaskModalShell
