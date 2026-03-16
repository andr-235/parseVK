import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommentsFiltersPanel from '@/modules/comments/components/CommentsFiltersPanel'

describe('CommentsFiltersPanel search mode', () => {
  it('switches view mode from comments to posts', async () => {
    const user = userEvent.setup()
    const onViewModeChange = vi.fn()

    render(
      <CommentsFiltersPanel
        searchTerm=""
        onSearchChange={() => {}}
        showKeywordComments
        onToggleKeywordComments={() => {}}
        showKeywordPosts={false}
        onToggleKeywordPosts={() => {}}
        readFilter="unread"
        onReadFilterChange={() => {}}
        keywordsCount={3}
        viewMode="comments"
        onViewModeChange={onViewModeChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Посты' }))

    expect(onViewModeChange).toHaveBeenCalledWith('posts')
  })
})
