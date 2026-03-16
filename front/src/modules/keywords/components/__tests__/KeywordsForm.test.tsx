import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { KeywordsForm } from '../KeywordsForm'

describe('KeywordsForm', () => {
  it('calls onRebuildForms from dedicated button', () => {
    const onRebuildForms = vi.fn()

    render(
      <KeywordsForm
        keywordValue=""
        categoryValue=""
        phraseValue=""
        isRecalculating={false}
        isRebuildingForms={false}
        onKeywordChange={() => {}}
        onCategoryChange={() => {}}
        onPhraseChange={() => {}}
        onAdd={() => {}}
        onAddPhrase={() => {}}
        onRecalculate={() => {}}
        onRebuildForms={onRebuildForms}
        onFileUpload={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /обновить словоформы/i }))

    expect(onRebuildForms).toHaveBeenCalledTimes(1)
  })
})
