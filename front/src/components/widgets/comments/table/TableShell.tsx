import type { RefObject, ReactNode, KeyboardEvent } from 'react'

export type TableShellProps = {
  tableRef: RefObject<HTMLDivElement | null>
  onKeyDown: (e: KeyboardEvent) => void
  children: ReactNode
}

export function TableShell({ tableRef, onKeyDown, children }: TableShellProps) {
  return (
    <div
      ref={tableRef} tabIndex={0} onKeyDown={onKeyDown}
      className="min-w-0 overflow-x-auto rounded-lg border border-border bg-bg-main focus-visible:outline-none"
      role="region"
      aria-label="Таблица комментариев. Используйте стрелки для навигации, C/V/R для статусов."
    >
      <table className="w-full text-sm" role="grid">
        {children}
      </table>
    </div>
  )
}
