import { useState, useEffect } from 'react'

export function useTableKeyboardNavigation(length: number) {
  const [focusedRow, setFocusedRow] = useState(-1)
  const safeRow = focusedRow >= length ? -1 : focusedRow

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!length) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedRow((prev) => Math.min(Math.max(prev, -1) + 1, length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedRow((prev) => Math.max(prev >= length ? length - 1 : prev - 1, 0))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [length])

  return { focusedRow: safeRow, setFocusedRow }
}
