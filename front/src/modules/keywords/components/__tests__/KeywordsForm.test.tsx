import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KeywordsForm } from '../KeywordsForm'

describe('KeywordsForm', () => {
  it('disables add buttons when trimmed values are empty', () => {
    render(
      <KeywordsForm
        keywordValue="   "
        categoryValue=""
        categorySuggestions={[]}
        phraseValue=" "
        isRecalculating={false}
        isRebuildingForms={false}
        onKeywordChange={() => {}}
        onCategoryChange={() => {}}
        onPhraseChange={() => {}}
        onAdd={() => {}}
        onAddPhrase={() => {}}
        onRecalculate={() => {}}
        onRebuildForms={() => {}}
        onFileUpload={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: /^добавить$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /добавить фразу/i })).toBeDisabled()
  })

  it('renders category suggestions through datalist', () => {
    render(
      <KeywordsForm
        keywordValue="ремонт"
        categoryValue="Усл"
        categorySuggestions={['Услуги', 'Товары']}
        phraseValue=""
        isRecalculating={false}
        isRebuildingForms={false}
        onKeywordChange={() => {}}
        onCategoryChange={() => {}}
        onPhraseChange={() => {}}
        onAdd={() => {}}
        onAddPhrase={() => {}}
        onRecalculate={() => {}}
        onRebuildForms={() => {}}
        onFileUpload={() => {}}
      />
    )

    const categoryInput = screen.getByPlaceholderText(/категория/i)
    expect(categoryInput).toHaveAttribute('list', 'keyword-categories')
    const dataList = document.getElementById('keyword-categories')
    expect(dataList).not.toBeNull()
    expect(dataList?.querySelector('option[value="Услуги"]')).not.toBeNull()
    expect(dataList?.querySelector('option[value="Товары"]')).not.toBeNull()
  })

  it('calls onRebuildForms from dedicated button', () => {
    const onRebuildForms = vi.fn()

    render(
      <KeywordsForm
        keywordValue=""
        categoryValue=""
        categorySuggestions={[]}
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
