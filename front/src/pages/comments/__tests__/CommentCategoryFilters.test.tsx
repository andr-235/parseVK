import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CommentCategoryFilters } from '../components/CommentCategoryFilters'

describe('CommentCategoryFilters', () => {
  it('selects a category tab', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <CommentCategoryFilters
        categories={['Услуги', 'Акции']}
        activeCategory={null}
        onSelectCategory={onSelect}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Акции' }))

    expect(onSelect).toHaveBeenCalledWith('Акции')
  })

  it('switches back to All tab', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    const { rerender } = render(
      <CommentCategoryFilters
        categories={['Услуги', 'Акции']}
        activeCategory="Акции"
        onSelectCategory={onSelect}
      />
    )

    await user.click(screen.getByRole('tab', { name: /^Все/ }))

    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
