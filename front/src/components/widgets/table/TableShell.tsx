import type { RefObject, ReactNode, KeyboardEvent } from 'react'

export type TableShellProps = {
  children: ReactNode
  tableRef?: RefObject<HTMLDivElement | null>
  onKeyDown?: (e: KeyboardEvent) => void
  ariaLabel?: string
}

export function TableShell({ children, tableRef, onKeyDown, ariaLabel }: TableShellProps) {
  return (
    <div
      ref={tableRef}
      tabIndex={tableRef ? 0 : undefined}
      onKeyDown={onKeyDown}
      className="min-w-0 overflow-x-auto rounded-lg border border-border bg-bg-main focus-visible:outline-none"
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
    >
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  )
}
