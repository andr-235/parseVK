import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: ReactNode
  className?: string
}

const MainContent = forwardRef<HTMLElement, MainContentProps>(function MainContent(
  { children, className },
  ref
) {
  return (
    <main
      ref={ref}
      className={cn(
        'flex-1 min-w-0 overflow-x-hidden',
        'bg-background-primary transition-colors duration-300',
        className
      )}
    >
      <div className="flex flex-col gap-8 px-4 pb-12 sm:px-6 md:gap-10 lg:px-8 lg:pb-16">
        {children}
      </div>
    </main>
  )
})

export default MainContent
