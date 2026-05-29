import { type ReactNode, forwardRef } from 'react'
import { cn } from '@/shared/utils'

interface PageContainerProps extends React.ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | '7xl' | '1600px' | '400'
  animate?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1440px]',
  '2xl': 'max-w-[1600px]',
  '1600px': 'max-w-[1600px]',
  '400': 'max-w-400',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(function PageContainer(
  { children, maxWidth = '1600px', animate = true, className, ...props },
  ref
) {
  const resolvedMaxWidth = maxWidthClasses[maxWidth] || maxWidthClasses['1600px']

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-10 mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body',
        resolvedMaxWidth,
        animate && 'animate-in fade-in-0 slide-in-from-bottom-4 duration-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
