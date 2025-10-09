import type { ReactNode } from 'react'

interface MainContentProps {
  children: ReactNode
}

function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-background-primary px-8 py-8 transition-colors duration-300 lg:px-12">
      {children}
    </main>
  )
}

export default MainContent
