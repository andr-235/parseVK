import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

interface StatCellProps {
  label: string
  labelColor?: 'primary' | 'secondary'
  children: ReactNode
  className?: string
}

export const StatCell = ({ label, labelColor = 'secondary', children, className }: StatCellProps) => (
  <div className={cn('rounded-xl border border-border/50 bg-background-primary/50 p-3.5', className)}>
    <p className={cn(
      'font-monitoring-body text-xs font-semibold uppercase tracking-wider mb-0.5',
      labelColor === 'primary' ? 'text-accent-primary' : 'text-text-secondary'
    )}>
      {label}
    </p>
    {children}
  </div>
)
