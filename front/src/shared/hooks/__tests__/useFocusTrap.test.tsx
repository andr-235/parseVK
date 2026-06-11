import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from '../useFocusTrap'
import { useState } from 'react'

function TestComponent({ active }: { active: boolean }) {
  const ref = useFocusTrap(active)
  return (
    <div>
      <button data-testid="outside">Outside</button>
      <div ref={ref} data-testid="container">
        <button data-testid="button1">Button 1</button>
        <button data-testid="button2">Button 2</button>
        <a href="#link" data-testid="link">Link</a>
      </div>
    </div>
  )
}

function ToggleTestComponent() {
  const [active, setActive] = useState(false)
  const ref = useFocusTrap(active)
  return (
    <div>
      <button data-testid="toggle-btn" onClick={() => setActive(prev => !prev)}>Toggle</button>
      <div ref={ref}>
        <button data-testid="inside-btn">Inside</button>
      </div>
    </div>
  )
}

describe('useFocusTrap', () => {
  it('does not trap focus when active is false', () => {
    render(<TestComponent active={false} />)
    const outside = screen.getByTestId('outside')
    outside.focus()
    expect(document.activeElement).toBe(outside)
  })

  it('automatically focuses first element when active becomes true', () => {
    render(<TestComponent active={true} />)
    const button1 = screen.getByTestId('button1')
    expect(document.activeElement).toBe(button1)
  })

  it('cycles focus forwards with Tab key', async () => {
    const user = userEvent.setup()
    render(<TestComponent active={true} />)
    
    const button1 = screen.getByTestId('button1')
    const button2 = screen.getByTestId('button2')
    const link = screen.getByTestId('link')
    
    expect(document.activeElement).toBe(button1)
    
    await user.tab()
    expect(document.activeElement).toBe(button2)
    
    await user.tab()
    expect(document.activeElement).toBe(link)
    
    // Tab from last element wraps to first
    await user.tab()
    expect(document.activeElement).toBe(button1)
  })

  it('cycles focus backwards with Shift+Tab key', async () => {
    const user = userEvent.setup()
    render(<TestComponent active={true} />)
    
    const button1 = screen.getByTestId('button1')
    const link = screen.getByTestId('link')
    
    expect(document.activeElement).toBe(button1)
    
    // Shift+Tab on first wraps to last
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(link)
  })

  it('restores focus to previously focused element when deactivated', async () => {
    const user = userEvent.setup()
    render(<ToggleTestComponent />)
    
    const toggleBtn = screen.getByTestId('toggle-btn')
    toggleBtn.focus()
    expect(document.activeElement).toBe(toggleBtn)
    
    // Activate trap
    await user.click(toggleBtn)
    const insideBtn = screen.getByTestId('inside-btn')
    expect(document.activeElement).toBe(insideBtn)
    
    // Deactivate trap (insideBtn is focused when active is true, but clicking toggleBtn will deactivate)
    await user.click(toggleBtn)
    // The focus should be restored to toggleBtn (which was active before trap)
    expect(document.activeElement).toBe(toggleBtn)
  })
})
