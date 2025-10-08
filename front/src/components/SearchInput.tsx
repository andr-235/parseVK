import { memo, useCallback } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SearchInput = memo(function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск...',
}: SearchInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div className="relative w-full">
      <input
        type="text"
        className="w-full rounded-xl border border-border bg-background-primary px-4 py-2.5 pr-10 text-sm text-text-primary shadow-soft-sm transition-colors duration-200 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-base text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60"
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
