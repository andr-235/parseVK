import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KeywordCard } from '../KeywordCard'

describe('KeywordCard', () => {
  it('switches to inline category edit mode and saves a new category', async () => {
    const onUpdateCategory = vi.fn().mockResolvedValue(undefined)

    render(
      <KeywordCard
        keyword={{ id: 1, word: 'путлер', category: 'Оскорбление' }}
        categorySuggestions={['Оскорбление', 'Политика']}
        onDelete={() => {}}
        onManageForms={() => {}}
        onUpdateCategory={onUpdateCategory}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /редактировать категорию/i }))

    const input = screen.getByLabelText(/категория слова/i)
    fireEvent.change(input, { target: { value: 'Политика' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onUpdateCategory).toHaveBeenCalledWith(1, 'Политика')
  })
})
