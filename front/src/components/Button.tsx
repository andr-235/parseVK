import { memo } from 'react'
import '../App.css'

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
  const handleClick = () => {
    if (disabled) {
      return
    }

    if (onClick) {
      void onClick()
    }
  }

  const buttonClassName = [
    'button',
    variant !== 'primary' ? variant : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={buttonClassName} onClick={handleClick} type={type} disabled={disabled}>
      {children}
    </button>
  )
})

export default Button
