import * as React from 'react'

import { cn } from '@/shared/utils'

export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneClasses: Record<StatusBadgeTone, { root: string; dot: string; ping: string }> = {
  success: {
    root: 'border-accent-success/20 bg-accent-success/10 text-accent-success',
    dot: 'bg-accent-success',
    ping: 'bg-accent-success',
  },
  warning: {
    root: 'border-accent-warning/20 bg-accent-warning/10 text-accent-warning',
    dot: 'bg-accent-warning',
    ping: 'bg-accent-warning',
  },
  danger: {
    root: 'border-accent-danger/20 bg-accent-danger/10 text-accent-danger',
    dot: 'bg-accent-danger',
    ping: 'bg-accent-danger',
  },
  info: {
    root: 'border-accent-info/20 bg-accent-info/10 text-accent-info',
    dot: 'bg-accent-info',
    ping: 'bg-accent-info',
  },
  neutral: {
    root: 'border-border/60 bg-background-secondary text-text-secondary',
    dot: 'bg-text-secondary',
    ping: 'bg-text-secondary',
  },
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: StatusBadgeTone
  pulse?: boolean
}

function StatusBadge({
  tone = 'neutral',
  pulse = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const classes = toneClasses[tone]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        classes.root,
        className
      )}
      {...props}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              classes.ping
            )}
          />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', classes.dot)} />
      </span>
      <span>{children}</span>
    </div>
  )
}

export { StatusBadge }
