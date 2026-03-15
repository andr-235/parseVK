import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CreateParseTaskModal from '../CreateParseTaskModal'

describe('CreateParseTaskModal', () => {
  it('отправляет recheck_group для действия перепроверки', async () => {
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

    await user.click(screen.getByRole('button', { name: /перепроверить группу/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      groupIds: [1],
      mode: 'recheck_group',
    })
  })
})
