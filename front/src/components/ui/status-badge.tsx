import * as React from 'react'

import { cn } from '@/utils/common'

export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneClasses: Record<
  StatusBadgeTone,
  { root: string; dot: string; ping: string }
> = {
  success: {
    root: 'border-green-500/20 bg-green-500/10 text-green-400',
    dot: 'bg-green-500',
    ping: 'bg-green-500',
  },
  warning: {
    root: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    dot: 'bg-amber-500',
    ping: 'bg-amber-500',
  },
  danger: {
    root: 'border-red-500/20 bg-red-500/10 text-red-400',
    dot: 'bg-red-500',
    ping: 'bg-red-500',
  },
  info: {
    root: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    dot: 'bg-cyan-500',
    ping: 'bg-cyan-500',
  },
  neutral: {
    root: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
    dot: 'bg-slate-500',
    ping: 'bg-slate-500',
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
