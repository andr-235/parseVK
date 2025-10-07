import '../App.css'
import { forwardRef } from 'react'

interface InputProps {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEnter?: () => void | Promise<void>
  placeholder?: string
  type?: string
  accept?: string
  style?: React.CSSProperties
  id?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, onEnter, placeholder, type = 'text', accept, style, id }, ref) => {
    const handleKeyPress = onEnter
      ? (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            void onEnter()
          }
        }
      : undefined

    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="keyword-input"
        accept={accept}
        style={style}
        id={id}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
