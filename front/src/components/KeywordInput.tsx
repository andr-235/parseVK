import type { ChangeEvent, KeyboardEvent } from 'react'
import { useState, useRef, useEffect } from 'react'
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
  const [isFocused, setIsFocused] = useState(false)
  const [isCategoryFocused, setIsCategoryFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const [fontSize, setFontSize] = useState(14)
  const [categoryFontSize, setCategoryFontSize] = useState(14)

  useEffect(() => {
    const adjustFontSize = () => {
      if (inputRef.current && placeholder) {
        const inputWidth = inputRef.current.offsetWidth
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (context) {
          context.font = '14px system-ui'
          const textWidth = context.measureText(placeholder).width
          if (textWidth > inputWidth - 40) { // 40px for padding
            const newFontSize = Math.max(10, (inputWidth - 40) / textWidth * 14)
            setFontSize(newFontSize)
          } else {
            setFontSize(14)
          }
        }
      }

      if (categoryInputRef.current && categoryPlaceholder) {
        const inputWidth = categoryInputRef.current.offsetWidth
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (context) {
          context.font = '14px system-ui'
          const textWidth = context.measureText(categoryPlaceholder).width
          if (textWidth > inputWidth - 40) { // 40px for padding
            const newFontSize = Math.max(10, (inputWidth - 40) / textWidth * 14)
            setCategoryFontSize(newFontSize)
          } else {
            setCategoryFontSize(14)
          }
        }
      }
    }

    adjustFontSize()
    window.addEventListener('resize', adjustFontSize)
    return () => window.removeEventListener('resize', adjustFontSize)
  }, [placeholder, categoryPlaceholder])

  const handleAdd = () => {
    void onAdd()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void onAdd()
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleCategoryFocus = () => {
    setIsCategoryFocused(true)
  }

  const handleCategoryBlur = () => {
    setIsCategoryFocused(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border/40 bg-background/30 px-2.5 py-2.5 shadow-none backdrop-blur supports-[backdrop-filter]:bg-background/20">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {onCategoryChange && (
            <div className="relative sm:w-[220px]">
              <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
              <Input
                ref={categoryInputRef}
                value={categoryValue}
                onChange={onCategoryChange}
                onFocus={handleCategoryFocus}
                onBlur={handleCategoryBlur}
                placeholder={categoryPlaceholder}
                className="pl-9"
                style={{
                  fontSize: categoryValue || isCategoryFocused ? '14px' : `${categoryFontSize}px`,
                  transition: 'font-size 0.2s ease-in-out'
                }}
              />
            </div>
          )}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            <Input
              ref={inputRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className="sm:min-w-[270px] sm:flex-1 pl-9"
              style={{
                fontSize: value || isFocused ? '14px' : `${fontSize}px`,
                transition: 'font-size 0.2s ease-in-out'
              }}
            />
          </div>
          <Button onClick={handleAdd} className="w-full sm:w-auto min-w-24">
            Добавить
          </Button>
        </div>
      </div>
    </div>
  )
}

export default KeywordInput
