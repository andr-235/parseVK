import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Select } from '../../ui'
import { PAGE_SIZE_OPTIONS } from './constants'

export type PaginationBarProps = {
  page: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}

function getPageRange(page: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  if (page > 3) pages.push('ellipsis')
  const start = Math.max(2, page - 1)
  const end = Math.min(total - 1, page + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (page < total - 2) pages.push('ellipsis')
  if (total > 1) pages.push(total)
  return pages
}

export function PaginationBar({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationBarProps) {
  const pages = useMemo(() => getPageRange(page, totalPages), [page, totalPages])

  return (
    <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
      <span role="status">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} из {totalItems}
      </span>
      <nav className="flex items-center gap-1" aria-label="Пагинация">
        <Button variant="ghost" size="xs" onClick={() => onPageChange(Math.max(page - 1, 1))} disabled={page === 1} aria-label="Предыдущая страница" semantic="default">
          <ChevronLeft size={16} />
        </Button>
        {pages.map((n, idx) =>
          n === 'ellipsis' ? (
            <span key={`e${idx}`} className="flex min-w-[28px] items-center justify-center text-xs text-text-muted">
              &hellip;
            </span>
          ) : (
            <button
              key={n} onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined} aria-label={`Страница ${n}`}
              className={`flex min-w-[44px] min-h-[44px] items-center justify-center rounded text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${n === page ? 'bg-accent-soft text-accent font-medium' : 'text-text-secondary hover:bg-bg-hover'}`}
            >
              {n}
            </button>
          ),
        )}
        <Button variant="ghost" size="xs" onClick={() => onPageChange(Math.min(page + 1, totalPages))} disabled={page === totalPages} aria-label="Следующая страница" semantic="default">
          <ChevronRight size={16} />
        </Button>
      </nav>
      <Select
        value={`${pageSize}`}
        options={PAGE_SIZE_OPTIONS.map(String)}
        onChange={(v) => onPageSizeChange(Number(v))}
        label="Элементов на странице"
      />
    </div>
  )
}
