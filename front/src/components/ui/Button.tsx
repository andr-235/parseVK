import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'soft' | 'link'
export type Semantic = 'default' | 'success' | 'danger' | 'warning'
type Size = 'xs' | 'sm' | 'md'

export type ButtonProps = {
  variant?: Variant
  semantic?: Semantic
  size?: Size
  children?: ReactNode
  icon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
const transition = 'transition-colors duration-150'

const variantStyles: Record<Variant, string> = {
  primary:
    'font-medium text-text-on-accent',
  secondary:
    'border border-border',
  ghost:
    '',
  icon:
    'min-w-[44px] min-h-[44px] p-1',
  soft:
    'font-medium',
  link:
    'hover:underline',
}

const semanticStyles: Record<Variant, Record<Semantic, string>> = {
  primary: {
    default: 'bg-accent hover:bg-accent-hover disabled:opacity-50',
    success: 'bg-success hover:opacity-90 disabled:opacity-50',
    danger: 'bg-danger hover:opacity-90 disabled:opacity-50',
    warning: 'bg-warning hover:opacity-90 disabled:opacity-50',
  },
  secondary: {
    default: 'text-text-secondary hover:bg-bg-hover disabled:opacity-50',
    success: 'text-success hover:bg-success-soft border-success/30 disabled:opacity-50',
    danger: 'text-danger hover:bg-danger-soft border-danger/30 disabled:opacity-50',
    warning: 'text-warning hover:bg-warning-soft border-warning/30 disabled:opacity-50',
  },
  ghost: {
    default: 'text-text-secondary hover:bg-bg-hover disabled:opacity-50',
    success: 'text-text-secondary hover:text-success hover:bg-success-soft disabled:opacity-50',
    danger: 'text-text-secondary hover:text-danger hover:bg-danger-soft disabled:opacity-50',
    warning: 'text-text-secondary hover:text-warning hover:bg-warning-soft disabled:opacity-50',
  },
  icon: {
    default: 'text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-50',
    success: 'text-text-muted hover:text-success hover:bg-success-soft disabled:opacity-50',
    danger: 'text-text-muted hover:text-danger hover:bg-danger-soft disabled:opacity-50',
    warning: 'text-text-muted hover:text-warning hover:bg-warning-soft disabled:opacity-50',
  },
  soft: {
    default: 'text-accent bg-accent-soft hover:opacity-80 disabled:opacity-50',
    success: 'text-success bg-success-soft hover:opacity-80 disabled:opacity-50',
    danger: 'text-danger bg-danger-soft hover:opacity-80 disabled:opacity-50',
    warning: 'text-warning bg-warning-soft hover:opacity-80 disabled:opacity-50',
  },
  link: {
    default: 'text-accent hover:text-accent-hover disabled:opacity-50',
    success: 'text-success hover:opacity-80 disabled:opacity-50',
    danger: 'text-danger hover:opacity-80 disabled:opacity-50',
    warning: 'text-warning hover:opacity-80 disabled:opacity-50',
  },
}

const sizeStyles: Record<Variant, Record<Size, string>> = {
  primary: { xs: 'px-2.5 py-1.5 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' },
  secondary: { xs: 'px-2.5 py-1.5 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' },
  ghost: { xs: 'px-2.5 py-1.5 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' },
  icon: { xs: '', sm: '', md: '' },
  soft: { xs: 'px-2.5 py-1.5 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' },
  link: { xs: 'text-xs', sm: 'text-sm', md: 'text-sm' },
}

export function Button({
  variant = 'secondary', semantic = 'default', size = 'sm',
  children, icon, className = '', ...rest
}: ButtonProps) {
  const cls = [
    'inline-flex items-center justify-center gap-1.5 rounded-md',
    focusRing,
    transition,
    variantStyles[variant],
    semanticStyles[variant][semantic],
    sizeStyles[variant][size],
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={cls} {...rest}>
      {icon && icon}
      {children}
    </button>
  )
}
