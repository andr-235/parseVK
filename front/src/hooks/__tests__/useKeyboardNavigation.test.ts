import { renderHook } from '@testing-library/react'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

describe('useKeyboardNavigation', () => {
  let mockOnSelect: jest.Mock
  let mockOnFocusChange: jest.Mock

  beforeEach(() => {
    mockOnSelect = jest.fn()
    mockOnFocusChange = jest.fn()
  })

  it('should handle ArrowDown key correctly', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 5,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as any

    // Mock tableRef.current.querySelector
    const mockRow = { focus: jest.fn() }
    const mockQuerySelector = jest.fn().mockReturnValue(mockRow)
    ;(result.current.tableRef.current as any) = {
      querySelector: mockQuerySelector,
    }

    result.current.handleKeyDown(mockEvent, 0)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockQuerySelector).toHaveBeenCalledWith('[data-row-index="1"]')
    expect(mockOnFocusChange).toHaveBeenCalledWith(1)
    expect(mockRow.focus).toHaveBeenCalled()
  })

  it('should handle ArrowUp key correctly', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 5,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
    } as any

    const mockRow = { focus: jest.fn() }
    const mockQuerySelector = jest.fn().mockReturnValue(mockRow)
    ;(result.current.tableRef.current as any) = {
      querySelector: mockQuerySelector,
    }

    result.current.handleKeyDown(mockEvent, 2)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockQuerySelector).toHaveBeenCalledWith('[data-row-index="1"]')
    expect(mockOnFocusChange).toHaveBeenCalledWith(1)
    expect(mockRow.focus).toHaveBeenCalled()
  })

  it('should handle Enter key correctly', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 5,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
    } as any

    result.current.handleKeyDown(mockEvent, 2)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockOnSelect).toHaveBeenCalledWith(2)
  })

  it('should handle Space key correctly', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 5,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: ' ',
      preventDefault: jest.fn(),
    } as any

    result.current.handleKeyDown(mockEvent, 1)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockOnSelect).toHaveBeenCalledWith(1)
  })

  it('should not navigate beyond bounds for ArrowDown', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 3,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as any

    const mockRow = { focus: jest.fn() }
    const mockQuerySelector = jest.fn().mockReturnValue(mockRow)
    ;(result.current.tableRef.current as any) = {
      querySelector: mockQuerySelector,
    }

    result.current.handleKeyDown(mockEvent, 2) // Last item

    expect(mockQuerySelector).toHaveBeenCalledWith('[data-row-index="2"]') // Should stay at 2
    expect(mockOnFocusChange).toHaveBeenCalledWith(2)
  })

  it('should not navigate beyond bounds for ArrowUp', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 3,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
    } as any

    const mockRow = { focus: jest.fn() }
    const mockQuerySelector = jest.fn().mockReturnValue(mockRow)
    ;(result.current.tableRef.current as any) = {
      querySelector: mockQuerySelector,
    }

    result.current.handleKeyDown(mockEvent, 0) // First item

    expect(mockQuerySelector).toHaveBeenCalledWith('[data-row-index="0"]') // Should stay at 0
    expect(mockOnFocusChange).toHaveBeenCalledWith(0)
  })

  it('should not call focus if row is not found', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 5,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as any

    const mockQuerySelector = jest.fn().mockReturnValue(null)
    ;(result.current.tableRef.current as any) = {
      querySelector: mockQuerySelector,
    }

    result.current.handleKeyDown(mockEvent, 0)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockQuerySelector).toHaveBeenCalledWith('[data-row-index="1"]')
    // onFocusChange is called only if the row is found
    expect(mockOnFocusChange).not.toHaveBeenCalled()
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('should handle ArrowDown at last item', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 3,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as any

    const mockRow = { focus: jest.fn() }
    const mockQuerySelector = jest.fn().mockReturnValue(mockRow)
    ;(result.current.tableRef.current as any) = {
      querySelector: mockQuerySelector,
    }

    result.current.handleKeyDown(mockEvent, 2) // Last item

    expect(mockQuerySelector).toHaveBeenCalledWith('[data-row-index="2"]') // Should stay at 2
    expect(mockOnFocusChange).toHaveBeenCalledWith(2)
  })

  it('should ignore other keys', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemsLength: 5,
        onSelect: mockOnSelect,
        onFocusChange: mockOnFocusChange,
      })
    )

    const mockEvent = {
      key: 'Tab',
      preventDefault: jest.fn(),
    } as any

    result.current.handleKeyDown(mockEvent, 0)

    expect(mockEvent.preventDefault).not.toHaveBeenCalled()
    expect(mockOnSelect).not.toHaveBeenCalled()
    expect(mockOnFocusChange).not.toHaveBeenCalled()
  })
})
