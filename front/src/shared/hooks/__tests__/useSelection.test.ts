import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelection } from '../useSelection'

describe('useSelection', () => {
  it('should initialize with an empty set', () => {
    const { result } = renderHook(() => useSelection<number>())
    expect(result.current.selected.size).toBe(0)
    expect(result.current.count).toBe(0)
  })

  it('should toggle item selection', () => {
    const { result } = renderHook(() => useSelection<number>())
    
    // Select item 1
    act(() => {
      result.current.toggle(1)
    })
    expect(result.current.selected.has(1)).toBe(true)
    expect(result.current.count).toBe(1)

    // Unselect item 1
    act(() => {
      result.current.toggle(1)
    })
    expect(result.current.selected.has(1)).toBe(false)
    expect(result.current.count).toBe(0)
  })

  it('should toggle all items', () => {
    const { result } = renderHook(() => useSelection<number>())
    const ids = [1, 2, 3]

    // Select all
    act(() => {
      result.current.toggleAll(ids)
    })
    expect(result.current.selected.has(1)).toBe(true)
    expect(result.current.selected.has(2)).toBe(true)
    expect(result.current.selected.has(3)).toBe(true)
    expect(result.current.count).toBe(3)

    // Unselect all (since size === ids.length)
    act(() => {
      result.current.toggleAll(ids)
    })
    expect(result.current.count).toBe(0)
  })

  it('should clear selection', () => {
    const { result } = renderHook(() => useSelection<number>())
    
    act(() => {
      result.current.toggle(1)
      result.current.toggle(2)
    })
    expect(result.current.count).toBe(2)

    act(() => {
      result.current.clear()
    })
    expect(result.current.count).toBe(0)
  })

  it('should deselect specific items', () => {
    const { result } = renderHook(() => useSelection<number>())

    act(() => {
      result.current.toggle(1)
      result.current.toggle(2)
      result.current.toggle(3)
    })
    expect(result.current.count).toBe(3)

    act(() => {
      result.current.deselect([1, 3])
    })
    expect(result.current.selected.has(2)).toBe(true)
    expect(result.current.selected.has(1)).toBe(false)
    expect(result.current.selected.has(3)).toBe(false)
    expect(result.current.count).toBe(1)
  })
})
