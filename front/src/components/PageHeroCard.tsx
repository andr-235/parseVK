import { type ReactNode } from 'react'
import { Card, CardHeader, CardDescription, CardFooter } from './ui/card'
import { cn } from '@/lib/utils'
import PageTitle from './PageTitle'

interface PageHeroCardProps {
  title: string
  description?: string
  actions?: ReactNode
  footer?: ReactNode
  className?: string
}

function PageHeroCard({ title, description, actions, footer, className }: PageHeroCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-none',
        'bg-gradient-to-br from-accent-primary/15 via-background-secondary to-background-secondary/90',
        className
      )}
    >
      <div className="pointer-events-none absolute -right-24 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full bg-accent-primary/20 blur-3xl md:block" />

      <CardHeader className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <PageTitle className="font-semibold text-text-primary">{title}</PageTitle>
          {description && (
            <CardDescription className="max-w-xl text-sm leading-relaxed md:max-w-lg md:text-base">
              {description}
            </CardDescription>
          )}
        </div>

        {actions && (
          <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
            {actions}
          </div>
        )}
      </CardHeader>

      {footer && (
        <CardFooter className="relative z-10 flex flex-wrap gap-2 pt-0">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}

export default PageHeroCard
