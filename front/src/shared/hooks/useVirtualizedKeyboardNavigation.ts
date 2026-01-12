import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'

type VirtualizedListRef =
  | {
      scrollToItem: (index: number, align?: string) => void
    }
  | {
      scrollToRow: (options: {
        index: number
        align?: 'auto' | 'center' | 'end' | 'smart' | 'start'
        behavior?: 'auto' | 'instant' | 'smooth'
      }) => void
    }

interface UseVirtualizedKeyboardNavigationOptions {
  itemsLength: number
  onSelect?: (index: number) => void
  onFocusChange?: (index: number) => void
  listRef: RefObject<VirtualizedListRef | null>
}

export const useVirtualizedKeyboardNavigation = ({
  itemsLength,
  onSelect,
  onFocusChange,
  listRef,
}: UseVirtualizedKeyboardNavigationOptions) => {
  const focusedIndexRef = useRef<number | null>(null)

  const scrollToIndex = useCallback(
    (index: number) => {
      const listInstance = listRef.current
      if (!listInstance) {
        return
      }

      if ('scrollToItem' in listInstance) {
        listInstance.scrollToItem(index, 'center')
        return
      }

      if ('scrollToRow' in listInstance) {
        listInstance.scrollToRow({ index, align: 'center' })
      }
    },
    [listRef]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      try {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const nextIndex = Math.min(index + 1, itemsLength - 1)
          onFocusChange?.(nextIndex)
          focusedIndexRef.current = nextIndex
          scrollToIndex(nextIndex)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          const prevIndex = Math.max(index - 1, 0)
          onFocusChange?.(prevIndex)
          focusedIndexRef.current = prevIndex
          scrollToIndex(prevIndex)
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(index)
        } else if (e.key === 'Home') {
          e.preventDefault()
          onFocusChange?.(0)
          focusedIndexRef.current = 0
          scrollToIndex(0)
        } else if (e.key === 'End') {
          e.preventDefault()
          const lastIndex = itemsLength - 1
          onFocusChange?.(lastIndex)
          focusedIndexRef.current = lastIndex
          scrollToIndex(lastIndex)
        }
      } catch (error) {
        console.error(`Ошибка при обработке клавиатурной навигации для индекса ${index}:`, error)
      }
    },
    [itemsLength, onSelect, onFocusChange, scrollToIndex]
  )

  useEffect(() => {
    if (focusedIndexRef.current !== null && focusedIndexRef.current >= itemsLength) {
      focusedIndexRef.current = null
    }
  }, [itemsLength])

  return {
    handleKeyDown,
    scrollToIndex,
  }
}
