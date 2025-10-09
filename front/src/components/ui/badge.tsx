import * as React from 'react'

import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const baseBadgeClasses =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors'

const variantClassNames: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-accent-primary/15 text-accent-primary',
  secondary: 'border-transparent bg-background-primary/70 text-text-secondary',
  destructive: 'border-transparent bg-accent-danger/15 text-accent-danger',
  outline: 'border-border/60 text-text-secondary'
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(baseBadgeClasses, variantClassNames[variant], className)}
      {...props}
    />
  )
})

Badge.displayName = 'Badge'

export { Badge, variantClassNames as badgeVariants }
