import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '../useDebounce'

describe('useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('updates the value only after the specified delay', () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: 'hello' },
    })

    rerender({ val: 'world' })
    expect(result.current).toBe('hello') // Not updated yet

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('hello') // Still not updated

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('world') // Updated after 300ms total
  })

  it('resets the timer if value changes again before delay', () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: 'first' },
    })

    rerender({ val: 'second' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('first')

    // Change value again before 300ms elapsed
    rerender({ val: 'third' })

    // If timer wasn't reset, it would update to 'third' in 100ms. Let's verify it doesn't.
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe('first')

    // Should update to 'third' after another 200ms (300ms since the last change)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('third')
  })
})
