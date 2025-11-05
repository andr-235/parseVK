import type { ChangeEvent } from 'react'
import { useState, useRef, useEffect } from 'react'
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
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [fontSize, setFontSize] = useState(14)

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
    }

    adjustFontSize()
    window.addEventListener('resize', adjustFontSize)
    return () => window.removeEventListener('resize', adjustFontSize)
  }, [placeholder])

  const handleAdd = () => {
    void onAdd()
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-1">
        {onCategoryChange && (
          <Input
            value={categoryValue}
            onChange={onCategoryChange}
            placeholder={categoryPlaceholder}
            className="sm:max-w-[280px]"
          />
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="sm:min-w-[280px] sm:flex-1"
          style={{
            fontSize: value || isFocused ? '14px' : `${fontSize}px`,
            transition: 'font-size 0.2s ease-in-out'
          }}
        />
      </div>
      <Button onClick={handleAdd} className="w-full sm:w-auto">
        Добавить
      </Button>
    </div>
  )
}

export default KeywordInput
