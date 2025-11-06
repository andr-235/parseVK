import type { ChangeEvent, KeyboardEvent } from 'react'
import { useRef } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Search, Tag } from 'lucide-react'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  

  const handleAdd = () => {
    void onAdd()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void onAdd()
    }
  }

  // focus handlers более не требуются — вёрстка упрощена

  return (
    <div className="flex flex-col gap-4">
      {/* Категория — отдельная строка */}
      {onCategoryChange && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="keyword-category" className="text-sm font-medium text-text-primary">
            Категория
          </label>
          <div className="relative">
            <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            <Input
              id="keyword-category"
              ref={categoryInputRef}
              value={categoryValue}
              onChange={onCategoryChange}
              
              placeholder={categoryPlaceholder}
              className="pl-9"
              aria-describedby="category-help"
            />
          </div>
          <span id="category-help" className="text-xs text-text-secondary">Необязательно. Например: “Акции”, “Спам”.</span>
        </div>
      )}

      {/* Ключевое слово — отдельная строка */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="keyword-word" className="text-sm font-medium text-text-primary">
          Ключевое слово
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            id="keyword-word"
            ref={inputRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center justify-start">
        <Button onClick={handleAdd} className="min-w-28">
          Добавить
        </Button>
      </div>
    </div>
  )
}

export default KeywordInput
