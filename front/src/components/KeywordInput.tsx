import type { ChangeEvent } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface KeywordInputProps {
  value: string
  categoryValue?: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onCategoryChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void | Promise<void>
  placeholder?: string
  categoryPlaceholder?: string
}

function KeywordInput({
  value,
  categoryValue = '',
  onChange,
  onCategoryChange,
  onAdd,
  placeholder,
  categoryPlaceholder,
}: KeywordInputProps) {
  const handleAdd = () => {
    void onAdd()
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-1">
        {onCategoryChange && (
          <Input
            value={categoryValue}
            onChange={onCategoryChange}
            placeholder={categoryPlaceholder}
            className="sm:max-w-[220px]"
          />
        )}
        <Input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="sm:min-w-[280px] sm:flex-1"
        />
      </div>
      <Button onClick={handleAdd} className="w-full sm:w-auto">
        Добавить
      </Button>
    </div>
  )
}

export default KeywordInput
