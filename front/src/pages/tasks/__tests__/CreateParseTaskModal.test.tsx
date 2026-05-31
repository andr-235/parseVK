import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CreateParseTaskModal from '../components/CreateParseTaskModal'

describe('CreateParseTaskModal', () => {
  it('не выбирает все группы автоматически при открытии', () => {
    render(
      <CreateParseTaskModal
        isOpen
        groups={[
          {
            id: 1,
            vkId: 123,
            name: 'Test group',
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 2,
            vkId: 456,
            name: 'Another group',
            createdAt: '',
            updatedAt: '',
          },
        ]}
        isLoading={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /создать парсинг постов \(0\)/i })).toBeDisabled()
  })

  it('отправляет recheck_group для режима перепроверки', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onClose = vi.fn()

    render(
      <CreateParseTaskModal
        isOpen
        groups={[
          {
            id: 1,
            vkId: 123,
            name: 'Test group',
            createdAt: '',
            updatedAt: '',
          },
        ]}
        isLoading={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )

    await user.click(screen.getByRole('button', { name: /перепроверка/i }))
    await user.click(screen.getByRole('checkbox', { name: /test group/i }))
    await user.click(screen.getByRole('button', { name: /создать перепроверку/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      groupIds: [123],
      mode: 'recheck_group',
    })
  })
})
