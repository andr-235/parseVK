import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from '../PasswordInput'

describe('PasswordInput', () => {
  it('renders password input by default', () => {
    render(<PasswordInput placeholder="Enter password" />)
    const input = screen.getByPlaceholderText('Enter password')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('toggles visibility on eye click', async () => {
    const user = userEvent.setup()
    render(<PasswordInput placeholder="pwd" />)
    const input = screen.getByPlaceholderText('pwd')
    const toggle = screen.getByRole('button')

    expect(input).toHaveAttribute('type', 'password')

    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')

    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('passes extra props to the input', () => {
    render(<PasswordInput placeholder="test" data-testid="pw" autoComplete="off" />)
    const input = screen.getByTestId('pw')
    expect(input).toHaveAttribute('autoComplete', 'off')
  })

  it('has accessible label on toggle button', () => {
    render(<PasswordInput placeholder="pwd" />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-label', 'Показать пароль')
  })

  it('updates aria-label after toggle', async () => {
    const user = userEvent.setup()
    render(<PasswordInput placeholder="pwd" />)
    const btn = screen.getByRole('button')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-label', 'Скрыть пароль')
  })
})
