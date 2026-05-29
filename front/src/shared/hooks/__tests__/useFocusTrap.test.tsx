import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { useFocusTrap } from '../useFocusTrap'
import userEvent from '@testing-library/user-event'

// Helper component to test useFocusTrap hook
const TestModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const containerRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose })

  if (!isOpen) return null

  return (
    <div data-testid="overlay">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="title"
        data-testid="modal-content"
      >
        <h2 id="title">Modal Title</h2>
        <button data-testid="btn-first">First Focusable</button>
        <input data-testid="input-second" type="text" defaultValue="Second Focusable" />
        <button data-testid="btn-last">Last Focusable</button>
      </div>
    </div>
  )
}

describe('useFocusTrap hook', () => {
  let mockOnClose: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnClose = vi.fn()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('locks body overflow and sets padding on mount, then restores them on unmount', () => {
    const { unmount } = render(<TestModal isOpen={true} onClose={mockOnClose} />)

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).not.toBe('')

    unmount()

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')
  })

  it('does not lock body overflow if modal is not open', () => {
    render(<TestModal isOpen={false} onClose={mockOnClose} />)

    expect(document.body.style.overflow).toBe('')
  })

  it('triggers onClose when Escape key is pressed', async () => {
    render(<TestModal isOpen={true} onClose={mockOnClose} />)

    await userEvent.keyboard('{Escape}')

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('autofocuses the first focusable element on mount', async () => {
    // We add a delay mock or wait since there is a 50ms setTimeout in the hook
    render(<TestModal isOpen={true} onClose={mockOnClose} />)

    await new Promise((resolve) => setTimeout(resolve, 100))

    const firstBtn = screen.getByTestId('btn-first')
    expect(document.activeElement).toBe(firstBtn)
  })

  it('wraps focus to the first element when pressing Tab on the last element', async () => {
    render(<TestModal isOpen={true} onClose={mockOnClose} />)
    await new Promise((resolve) => setTimeout(resolve, 100))

    const lastBtn = screen.getByTestId('btn-last')
    const firstBtn = screen.getByTestId('btn-first')

    // Focus last button manually
    lastBtn.focus()
    expect(document.activeElement).toBe(lastBtn)

    // Press Tab
    await userEvent.keyboard('{Tab}')

    // Focus should wrap back to the first button
    expect(document.activeElement).toBe(firstBtn)
  })

  it('wraps focus to the last element when pressing Shift+Tab on the first element', async () => {
    render(<TestModal isOpen={true} onClose={mockOnClose} />)
    await new Promise((resolve) => setTimeout(resolve, 100))

    const lastBtn = screen.getByTestId('btn-last')
    const firstBtn = screen.getByTestId('btn-first')

    // Focus first button
    firstBtn.focus()
    expect(document.activeElement).toBe(firstBtn)

    // Press Shift+Tab
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')

    // Focus should wrap to the last button
    expect(document.activeElement).toBe(lastBtn)
  })

  it('returns focus to the previously active element on unmount', async () => {
    // Create an element outside modal to focus initially
    const outsideBtn = document.createElement('button')
    outsideBtn.setAttribute('data-testid', 'outside-btn')
    document.body.appendChild(outsideBtn)
    outsideBtn.focus()

    expect(document.activeElement).toBe(outsideBtn)

    const { unmount } = render(<TestModal isOpen={true} onClose={mockOnClose} />)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Focus has moved to first button in modal
    const firstBtn = screen.getByTestId('btn-first')
    expect(document.activeElement).toBe(firstBtn)

    // Unmount modal
    unmount()

    // Focus should return to the outside button
    expect(document.activeElement).toBe(outsideBtn)
  })
})
