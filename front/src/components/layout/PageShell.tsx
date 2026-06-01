import type { ReactNode } from 'react'

type PageShellProps = {
  title: string
  children: ReactNode
  sidebar?: ReactNode
}

export function PageShell({ title, children, sidebar }: PageShellProps) {
  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex flex-1 flex-col min-w-0 p-6">
        <h1 className="mb-6 text-lg font-semibold text-text-primary">{title}</h1>
        {children}
      </div>
      {sidebar}
    </div>
  )
}
