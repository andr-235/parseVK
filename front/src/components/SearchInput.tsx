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
    <div className="search-input-wrapper">
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <button className="search-clear" onClick={handleClear} aria-label="Очистить поиск">
          ✕
        </button>
      )}
    </div>
  )
})

export default SearchInput
