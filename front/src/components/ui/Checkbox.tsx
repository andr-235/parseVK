import type { InputHTMLAttributes } from 'react'

type CheckboxProps = InputHTMLAttributes<HTMLInputElement>

export function Checkbox({ className = '', ...rest }: CheckboxProps) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <input
        type="checkbox"
        className={`peer h-4 w-4 appearance-none rounded border border-border bg-bg-main checked:border-accent checked:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-main ${className}`}
        {...rest}
      />
      <svg
        className="pointer-events-none absolute hidden peer-checked:block h-3 w-3 text-text-on-accent"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2 6 5 9 10 3" />
      </svg>
    </span>
  )
}
