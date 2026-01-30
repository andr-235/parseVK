import { type ReactNode } from 'react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/shared/ui/empty'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: string | ReactNode
  title?: string
  description: string
  className?: string
  variant?: 'default' | 'custom'
}

export function EmptyState({
  icon,
  title = 'Список пуст',
  description,
  className,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'custom') {
    return (
      <div
        className={cn(
          'flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl bg-background-secondary/70 p-10 text-center text-text-secondary shadow-soft-sm md:p-12',
          className
        )}
        role="status"
      >
        {icon && (
          <div className="grid place-items-center rounded-2xl border border-border/40 bg-background-primary/80 p-6">
            <div className="flex h-[clamp(56px,16vw,68px)] w-[clamp(56px,16vw,68px)] items-center justify-center rounded-full bg-accent-primary/10 text-[clamp(28px,8vw,36px)] text-accent-primary">
              {typeof icon === 'string' ? icon : icon}
            </div>
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="max-w-[420px] text-[15px] leading-relaxed">{description}</p>
      </div>
    )
  }

  return (
    <Empty className={className} role="status">
      <EmptyHeader>
        {icon && <EmptyMedia variant="icon">{typeof icon === 'string' ? icon : icon}</EmptyMedia>}
        {title && <EmptyTitle>{title}</EmptyTitle>}
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
