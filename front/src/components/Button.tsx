import { memo } from 'react'
import '../App.css'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void | Promise<void>
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const Button = memo(function Button({ children, onClick, type = 'button', disabled = false }: ButtonProps) {
  const handleClick = () => {
    if (disabled) {
      return
    }

    if (onClick) {
      void onClick()
    }
  }

  return (
    <button className="button" onClick={handleClick} type={type} disabled={disabled}>
      {children}
    </button>
  )
})

export default Button
