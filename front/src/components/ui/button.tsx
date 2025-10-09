import * as React from 'react'

import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const baseButtonClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60'

const variantClassNames: Record<ButtonVariant, string> = {
  default: 'bg-accent-primary text-white shadow-soft-md hover:bg-accent-primary/90 focus-visible:ring-accent-primary/40',
  secondary:
    'border border-border/70 bg-background-primary/80 text-text-primary shadow-soft-sm hover:bg-background-primary focus-visible:ring-accent-primary/30',
  destructive:
    'bg-accent-danger text-white shadow-soft-md hover:bg-accent-danger/90 focus-visible:ring-accent-danger/40',
  outline:
    'border border-border/70 bg-transparent text-text-primary shadow-soft-sm hover:border-accent-primary/50 hover:text-accent-primary focus-visible:ring-accent-primary/30',
  ghost: 'text-text-secondary shadow-none hover:text-text-primary hover:bg-background-primary/60 focus-visible:ring-accent-primary/20',
  link: 'text-accent-primary underline-offset-4 hover:underline focus-visible:ring-accent-primary/20'
}

const sizeClassNames: Record<ButtonSize, string> = {
  default: 'h-11 px-5',
  sm: 'h-9 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10'
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export type ButtonStyleOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function buttonVariants({ variant = 'default', size = 'default', className }: ButtonStyleOptions = {}): string {
  return cn(baseButtonClasses, variantClassNames[variant], sizeClassNames[size], className)
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        type={type}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
