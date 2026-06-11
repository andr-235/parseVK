import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`h-8 min-w-0 flex-1 basis-40 rounded-md border border-border bg-bg-main px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-invalid:border-danger aria-invalid:focus-visible:ring-danger transition-colors duration-150 ${className}`}
      {...rest}
    />
  )
})
