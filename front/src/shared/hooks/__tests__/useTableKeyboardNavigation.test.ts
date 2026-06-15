import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTableKeyboardNavigation } from '../useTableKeyboardNavigation'

describe('useTableKeyboardNavigation', () => {
  it('should initialize with focusedRow as -1', () => {
    const { result } = renderHook(() => useTableKeyboardNavigation(5))
    expect(result.current.focusedRow).toBe(-1)
  })

  it('should increment focusedRow on ArrowDown up to length - 1', () => {
    const { result } = renderHook(() => useTableKeyboardNavigation(3))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.focusedRow).toBe(0)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.focusedRow).toBe(1)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.focusedRow).toBe(2)

    // Should not exceed length - 1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.focusedRow).toBe(2)
  })

  it('should decrement focusedRow on ArrowUp down to 0', () => {
    const { result } = renderHook(() => useTableKeyboardNavigation(3))

    // Set focusedRow to 2
    act(() => {
      result.current.setFocusedRow(2)
    })
    expect(result.current.focusedRow).toBe(2)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(result.current.focusedRow).toBe(1)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(result.current.focusedRow).toBe(0)

    // Should not go below 0
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(result.current.focusedRow).toBe(0)
  })

  it('should ignore keyboard events if focused inside input elements', () => {
    const { result } = renderHook(() => useTableKeyboardNavigation(3))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    expect(result.current.focusedRow).toBe(-1)

    document.body.removeChild(input)
  })

  it('should do nothing if length is 0', () => {
    const { result } = renderHook(() => useTableKeyboardNavigation(0))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.focusedRow).toBe(-1)
  })

  it('should adjust focusedRow to -1 if length decreases below current focus index', () => {
    const { result, rerender } = renderHook(
      ({ length }) => useTableKeyboardNavigation(length),
      { initialProps: { length: 5 } }
    )

    act(() => {
      result.current.setFocusedRow(4)
    })
    expect(result.current.focusedRow).toBe(4)

    // Rerender with smaller length
    rerender({ length: 3 })
    expect(result.current.focusedRow).toBe(-1)
  })

  it('should clean up event listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useTableKeyboardNavigation(5))
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
