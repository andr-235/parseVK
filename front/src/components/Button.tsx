import { memo } from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void | Promise<void>
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}

const Button = memo(function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className,
}: ButtonProps) {
  const baseClassName =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

  const variantClassName = {
    primary: 'bg-accent-primary text-white hover:bg-accent-primary/90 focus-visible:ring-accent-primary',
    secondary:
      'border border-border bg-background-secondary text-text-primary hover:bg-background-secondary/80 focus-visible:ring-accent-primary',
    danger: 'bg-accent-danger text-white hover:bg-accent-danger/90 focus-visible:ring-accent-danger',
  }[variant]

  const handleClick = () => {
    if (disabled) {
      return
    }

    if (onClick) {
      void onClick()
    }
  }

  const buttonClassName = [baseClassName, variantClassName, className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <button className={buttonClassName} onClick={handleClick} type={type} disabled={disabled}>
      {children}
    </button>
  )
})

export default Button
