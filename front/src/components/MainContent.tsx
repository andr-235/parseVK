import type { ReactNode } from 'react'

interface MainContentProps {
  children: ReactNode
}

function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-background-primary transition-colors duration-300">
      <div className="flex flex-col gap-8 px-4 pb-12 sm:px-6 md:gap-10 lg:px-8 lg:pb-16">
        {children}
      </div>
    </main>
  )
}

export default MainContent
