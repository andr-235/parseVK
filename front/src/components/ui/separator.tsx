import * as React from 'react'

import { cn } from '../../lib/utils'

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, role, ...props }, ref) => {
    const ariaOrientation = orientation === 'horizontal' ? 'horizontal' : 'vertical'
    const defaultRole = decorative ? 'none' : role ?? 'separator'

    return (
      <div
        ref={ref}
        role={defaultRole}
        aria-orientation={ariaOrientation}
        className={cn(
          'shrink-0 bg-border/60',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className
        )}
        {...props}
      />
    )
  }
)

Separator.displayName = 'Separator'

export { Separator }
