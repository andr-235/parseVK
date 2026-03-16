import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { highlightKeywords } from '../highlightKeywords'

describe('highlightKeywords', () => {
  it('highlights keyword forms when they are provided by backend', () => {
    render(
      <div>
        {highlightKeywords('В комментарии много клоунов', [
          { id: 1, word: 'клоун', forms: ['клоун', 'клоунов'] },
        ])}
      </div>
    )

    const highlighted = screen.getByText('клоунов')
    expect(highlighted.tagName.toLowerCase()).toBe('span')
  })
})
