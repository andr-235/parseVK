import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CommentCategoryFilters } from '../CommentCategoryFilters'

describe('CommentCategoryFilters', () => {
  it('toggles selected categories', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <CommentCategoryFilters
        categories={['Услуги', 'Акции']}
        selectedCategories={['Услуги']}
        onToggleCategory={onToggle}
        onClear={() => {}}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Акции' }))

    expect(onToggle).toHaveBeenCalledWith('Акции')
  })
})
