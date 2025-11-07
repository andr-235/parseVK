import { memo, useCallback, type ChangeEvent, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /**
   * Дополнительный класс для корневого контейнера. Используется для тонкой настройки позиционирования.
   */
  className?: string
  /**
   * Дополнительный класс для инпута. Позволяет менять типографику без переписывания компонента.
   */
  inputClassName?: string
  /**
   * Вариант оформления. "glass" используется для стеклянных панелей фильтров.
   */
  variant?: 'default' | 'glass'
  /**
   * Иконка слева внутри поля.
   */
  leadingIcon?: ReactNode
}

const SearchInput = memo(function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск...',
  className,
  inputClassName: inputClassNameProp,
  variant = 'default',
  leadingIcon,
}: SearchInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  const isGlass = variant === 'glass'
  const hasLeadingIcon = Boolean(leadingIcon)

  const wrapperClassName = cn(
    'relative w-full transition-all duration-300',
    isGlass &&
      'overflow-hidden rounded-2xl border border-white/10 bg-background-secondary px-3 py-1.5 shadow-soft-lg backdrop-blur-sm focus-within:border-accent-primary/70 focus-within:shadow-soft-lg dark:border-white/15 dark:bg-white/10',
    className,
  )

  const baseInputClass = isGlass
    ? 'h-12 w-full rounded-[1.75rem] border-0 bg-transparent text-base font-medium text-text-primary caret-accent-primary placeholder:text-text-secondary/70 selection:bg-accent-primary/20 selection:text-text-primary focus:outline-none focus:ring-0 dark:text-text-light dark:placeholder:text-text-light/60 dark:selection:bg-accent-primary/40'
    : 'w-full rounded-xl border border-border bg-background-primary text-sm text-text-primary caret-accent-primary shadow-soft-sm transition-colors duration-200 selection:bg-accent-primary/20 selection:text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 dark:selection:bg-accent-primary/40 dark:selection:text-text-light'

  const paddingLeftClass = hasLeadingIcon ? 'pl-11' : isGlass ? 'pl-5' : 'pl-4'
  const paddingRightClass = isGlass ? 'pr-14' : 'pr-10'

  const resolvedInputClassName = cn(
    baseInputClass,
    paddingLeftClass,
    paddingRightClass,
    isGlass ? 'py-0' : 'py-2.5',
    inputClassNameProp,
  )

  const clearButtonClassName = cn(
    'absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
    isGlass
      ? 'right-3 size-8 bg-white/10 text-text-secondary hover:bg-white/20 hover:text-text-primary focus-visible:ring-accent-primary/50 dark:bg-white/15 dark:hover:bg-white/25 dark:text-text-light'
      : 'right-2 h-7 w-7 text-base text-text-secondary hover:text-text-primary focus-visible:ring-accent-primary/60',
  )

  const iconClassName = cn(
    'pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-secondary transition-colors duration-200',
    isGlass ? 'left-5 text-base' : 'left-4 text-sm',
  )

  return (
    <div className={wrapperClassName}>
      {hasLeadingIcon && <span className={iconClassName}>{leadingIcon}</span>}
      <input
        type="text"
        className={resolvedInputClassName}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className={clearButtonClassName}
          onClick={handleClear}
          aria-label="Очистить поиск"
        >
          ✕
        </button>
      )}
    </div>
  )
})

export default SearchInput
