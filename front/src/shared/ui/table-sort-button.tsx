import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

import type { TableSortDirection } from '@/types'
import { cn } from '@/shared/utils'

interface TableSortButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  direction?: TableSortDirection | null
  children: ReactNode
}

const getSortIcon = (direction?: TableSortDirection | null) => {
  if (direction === 'asc') {
    return ChevronUp
  }

  if (direction === 'desc') {
    return ChevronDown
  }

  return ChevronsUpDown
}

export function TableSortButton({
  direction,
  children,
  className,
  ...props
}: TableSortButtonProps) {
  const Icon = getSortIcon(direction)

  return (
    <button
      type="button"
      className={cn(
        'group inline-flex w-full items-center justify-between gap-1 rounded-sm px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-pressed={direction !== null}
      {...props}
    >
      <span className="whitespace-nowrap">{children}</span>
      <Icon
        className={cn(
          'size-3.5 text-muted-foreground transition-colors group-hover:text-foreground',
          direction && 'text-foreground'
        )}
        aria-hidden="true"
      />
    </button>
  )
}
