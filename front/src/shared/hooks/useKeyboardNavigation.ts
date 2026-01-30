import { useCallback, useRef, type KeyboardEvent } from 'react'

interface UseKeyboardNavigationOptions {
  itemsLength: number
  onSelect?: (index: number) => void
  onFocusChange?: (index: number) => void
}

export const useKeyboardNavigation = ({
  itemsLength,
  onSelect,
  onFocusChange,
}: UseKeyboardNavigationOptions) => {
  const tableRef = useRef<HTMLTableElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      try {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const nextIndex = Math.min(index + 1, itemsLength - 1)
          const nextRow = tableRef.current?.querySelector(
            `[data-row-index="${nextIndex}"]`
          ) as HTMLElement
          if (nextRow) {
            onFocusChange?.(nextIndex)
            nextRow.focus()
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          const prevIndex = Math.max(index - 1, 0)
          const prevRow = tableRef.current?.querySelector(
            `[data-row-index="${prevIndex}"]`
          ) as HTMLElement
          if (prevRow) {
            onFocusChange?.(prevIndex)
            prevRow.focus()
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(index)
        }
      } catch (error) {
        console.error(`Ошибка при обработке клавиатурной навигации для индекса ${index}:`, error)
      }
    },
    [itemsLength, onSelect, onFocusChange]
  )

  return {
    tableRef,
    handleKeyDown,
  }
}
