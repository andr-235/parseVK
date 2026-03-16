import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KeywordFormsSheet } from '../KeywordFormsSheet'

vi.mock('@/shared/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('KeywordFormsSheet', () => {
  it('renders generated, manual and exclusion forms', () => {
    render(
      <KeywordFormsSheet
        open={true}
        onOpenChange={() => {}}
        keyword={{ id: 1, word: 'клоун', isPhrase: false }}
        forms={{
          keywordId: 1,
          word: 'клоун',
          isPhrase: false,
          generatedForms: ['клоунов'],
          manualForms: ['клоунами'],
          exclusions: ['клоуном'],
        }}
        isLoading={false}
        manualFormValue=""
        exclusionValue=""
        onManualFormChange={() => {}}
        onExclusionChange={() => {}}
        onAddManualForm={() => {}}
        onRemoveManualForm={() => {}}
        onAddExclusion={() => {}}
        onRemoveExclusion={() => {}}
      />
    )

    expect(screen.getByText('клоунов')).toBeInTheDocument()
    expect(screen.getByText('клоунами')).toBeInTheDocument()
    expect(screen.getByText('клоуном')).toBeInTheDocument()
  })

  it('calls removal handlers for manual forms and exclusions', () => {
    const onRemoveManualForm = vi.fn()
    const onRemoveExclusion = vi.fn()

    render(
      <KeywordFormsSheet
        open={true}
        onOpenChange={() => {}}
        keyword={{ id: 1, word: 'клоун', isPhrase: false }}
        forms={{
          keywordId: 1,
          word: 'клоун',
          isPhrase: false,
          generatedForms: [],
          manualForms: ['клоунами'],
          exclusions: ['клоуном'],
        }}
        isLoading={false}
        manualFormValue=""
        exclusionValue=""
        onManualFormChange={() => {}}
        onExclusionChange={() => {}}
        onAddManualForm={() => {}}
        onRemoveManualForm={onRemoveManualForm}
        onAddExclusion={() => {}}
        onRemoveExclusion={onRemoveExclusion}
      />
    )

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(deleteButtons[1])

    expect(onRemoveManualForm).toHaveBeenCalledWith('клоунами')
    expect(onRemoveExclusion).toHaveBeenCalledWith('клоуном')
  })
})
