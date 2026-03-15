import { vi } from 'vitest'
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import KeywordsTableCard from '../KeywordsTableCard'

vi.mock('@/shared/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

describe('KeywordsTableCard', () => {
  it('renders grouped keyword sections with uncategorized fallback', () => {
    render(
      <KeywordsTableCard
        keywords={[
          { id: 1, word: 'ремонт', category: 'Услуги' },
          { id: 2, word: 'акция', category: null },
        ]}
        isLoading={false}
        onDelete={() => {}}
        searchTerm=""
        onSearchChange={() => {}}
      />
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Услуги' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Без категории' })).toBeInTheDocument()
  })

  it('collapses category content', async () => {
    render(
      <KeywordsTableCard
        keywords={[{ id: 1, word: 'ремонт', category: 'Услуги' }]}
        isLoading={false}
        onDelete={() => {}}
        searchTerm=""
        onSearchChange={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /свернуть/i }))

    expect(screen.queryByText('ремонт')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /развернуть/i })).toBeInTheDocument()
  })
})
