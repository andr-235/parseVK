import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FriendsExportForm } from '../components/FriendsExportForm'

describe('FriendsExportForm', () => {
  it('shows spinner and "Запуск..." when loading', () => {
    render(
      <FriendsExportForm
        label="Test Label"
        placeholder="123"
        inputId="test-id"
        inputType="number"
        disabled={false}
        isLoading={true}
        validate={() => null}
        errorMessage="Required"
        buildParams={(v) => ({ val: Number(v) })}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByText('Запуск...')).toBeInTheDocument()
  })

  it('shows error message on empty submit', async () => {
    const user = userEvent.setup()
    render(
      <FriendsExportForm
        label="Test Label"
        placeholder="123"
        inputId="test-id"
        inputType="number"
        disabled={false}
        isLoading={false}
        validate={() => null}
        errorMessage="Field is required"
        buildParams={(v) => ({ val: Number(v) })}
        onSubmit={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(screen.getByText('Field is required')).toBeInTheDocument()
  })

  it('calls validate and shows custom error', async () => {
    const user = userEvent.setup()
    render(
      <FriendsExportForm
        label="Test Label"
        placeholder="123"
        inputId="test-id"
        inputType="number"
        disabled={false}
        isLoading={false}
        validate={(v) => (Number(v) <= 0 ? 'Must be positive' : null)}
        errorMessage="Required"
        buildParams={(v) => ({ val: Number(v) })}
        onSubmit={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('Test Label')
    await user.type(input, '-1')
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(screen.getByText('Must be positive')).toBeInTheDocument()
  })

  it('calls onSubmit with built params on valid input', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <FriendsExportForm
        label="Test Label"
        placeholder="123"
        inputId="test-id"
        inputType="number"
        disabled={false}
        isLoading={false}
        validate={() => null}
        errorMessage="Required"
        buildParams={(v) => ({ val: Number(v) })}
        onSubmit={onSubmit}
      />,
    )
    const input = screen.getByLabelText('Test Label')
    await user.type(input, '42')
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(onSubmit).toHaveBeenCalledWith({ val: 42 })
  })
})
