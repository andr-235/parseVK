import { cn } from '@/shared/utils'

interface PageTitleProps {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

function PageTitle({ children, className, as: Component = 'h1' }: PageTitleProps) {
  return (
    <Component className={cn('text-3xl font-semibold leading-none tracking-tight', className)}>
      {children}
    </Component>
  )
}

export default PageTitle
