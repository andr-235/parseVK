import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '../Checkbox'

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox />)
    const cb = screen.getByRole('checkbox')
    expect(cb).not.toBeChecked()
  })

  it('renders checked when controlled', () => {
    render(<Checkbox checked={true} onChange={() => {}} />)
    const cb = screen.getByRole('checkbox')
    expect(cb).toBeChecked()
  })

  it('calls onChange on click', async () => {
    const user = userEvent.setup()
    let checked = false
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { checked = e.target.checked }
    const { rerender } = render(<Checkbox checked={false} onChange={handleChange} />)
    const cb = screen.getByRole('checkbox')
    await user.click(cb)
    expect(checked).toBe(true)
    rerender(<Checkbox checked={true} onChange={handleChange} />)
    await user.click(cb)
    expect(checked).toBe(false)
  })

  it('renders checkmark svg when checked', () => {
    const { container } = render(<Checkbox checked={true} onChange={() => {}} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('peer-checked:block')
  })
})
