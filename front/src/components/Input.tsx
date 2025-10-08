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
  className?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, onEnter, placeholder, type = 'text', accept, style, id, className }, ref) => {
    const handleKeyPress = onEnter
      ? (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            void onEnter()
          }
        }
      : undefined

    const inputClassName = [
      'w-full rounded-xl border border-border bg-background-primary px-4 py-3 text-base text-text-primary shadow-soft-sm transition-colors duration-200 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className={inputClassName}
        accept={accept}
        style={style}
        id={id}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
