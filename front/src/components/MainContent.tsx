import type { ReactNode } from 'react'

interface MainContentProps {
  children: ReactNode
}

function MainContent({ children }: MainContentProps) {
  return (
    <main className="main-content">
      {children}
    </main>
  )
}

export default MainContent
