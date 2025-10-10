import { type ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: string
  headerActions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

function SectionCard({
  title,
  description,
  headerActions,
  children,
  className,
  headerClassName,
  contentClassName
}: SectionCardProps) {
  return (
    <Card className={cn('overflow-hidden border border-border/70 bg-background-secondary shadow-soft-lg', className)}>
      <CardHeader className={cn('gap-6 border-b border-border/60 pb-6', headerClassName)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-3">
              {headerActions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn('px-6 py-4', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

export default SectionCard
