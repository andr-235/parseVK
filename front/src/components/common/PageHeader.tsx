import React, { type ReactNode } from 'react'
import { Card, CardHeader, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/common'
import PageTitle from './PageTitle'

export interface PageHeaderCardConfig {
  icon: React.ComponentType<{ className?: string }>
  title: string | ReactNode
  subtitle: string
  bgGradientClass?: string
  borderGradientClass?: string
  iconBgClass?: string
  iconTextClass?: string
  customContent?: ReactNode
}

export interface PageHeaderBadgeConfig {
  icon: React.ComponentType<{ className?: string }>
  value: string | number
  label: string
  className?: string
}

interface PageHeaderProps {
  title: string | ReactNode
  description?: string
  actions?: ReactNode
  variant?: 'simple' | 'hero' | 'grid' | 'badges'
  cards?: PageHeaderCardConfig[]
  badges?: PageHeaderBadgeConfig[]
  footer?: ReactNode
  className?: string
  colsClass?: string // default: "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
}

export const PageHeader = ({
  title,
  description,
  actions,
  variant = 'simple',
  cards = [],
  badges = [],
  footer,
  className,
  colsClass = 'grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
}: PageHeaderProps) => {
  if (variant === 'hero') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border border-border/60 shadow-soft-sm',
          'bg-gradient-to-br from-accent-primary/10 via-background-secondary to-background-secondary/95',
          className
        )}
      >
        <div className="pointer-events-none absolute -right-24 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full bg-accent-primary/15 blur-3xl md:block" />

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
            <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end shrink-0">
              {actions}
            </div>
          )}
        </CardHeader>

        {footer && (
          <CardFooter className="relative z-10 flex flex-wrap gap-2 pt-0">{footer}</CardFooter>
        )}
      </Card>
    )
  }

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          {typeof title === 'string' ? (
            <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-text-light">
              {title}
            </h1>
          ) : (
            title
          )}
          {description && (
            <p className="text-text-secondary max-w-2xl text-lg font-monitoring-body">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {variant === 'grid' && cards.length > 0 && (
        <div className={cn('grid', colsClass)}>
          {cards.map((card, index) => {
            const Icon = card.icon

            let bgGradient = card.bgGradientClass
            let borderGradient = card.borderGradientClass
            let iconBg = card.iconBgClass
            let iconText = card.iconTextClass

            if (!bgGradient && !borderGradient && !iconBg && !iconText) {
              const styles = [
                {
                  bgGradient: 'from-accent-primary/20 to-accent-info/20',
                  borderGradient: 'via-accent-primary/50',
                  iconBg: 'bg-accent-primary/10',
                  iconText: 'text-accent-primary',
                },
                {
                  bgGradient: 'from-accent-info/20 to-accent-primary/20',
                  borderGradient: 'via-accent-info/50',
                  iconBg: 'bg-accent-info/10',
                  iconText: 'text-accent-info',
                },
              ]
              const style = styles[index % styles.length]
              bgGradient = style.bgGradient
              borderGradient = style.borderGradient
              iconBg = style.iconBg
              iconText = style.iconText
            }

            const finalIconBgClass = iconBg || 'bg-accent-primary/10'
            const finalIconTextClass = iconText || 'text-accent-primary'

            return (
              <div key={index} className="relative h-full">
                <Card className="relative border border-border/60 bg-background-secondary shadow-soft-sm p-5 overflow-hidden h-full">
                  {bgGradient && (
                    <div
                      className={cn('absolute inset-0 bg-gradient-to-br opacity-5', bgGradient)}
                    />
                  )}
                  {borderGradient && (
                    <div
                      className={cn(
                        'absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
                        borderGradient
                      )}
                    />
                  )}
                  <div className="relative flex items-start gap-3 h-full z-10">
                    <div
                      className={cn(
                        'p-2 rounded-lg shrink-0',
                        finalIconBgClass,
                        finalIconTextClass
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      {card.customContent ? (
                        card.customContent
                      ) : (
                        <>
                          <h3 className="font-monitoring-display text-sm font-semibold text-text-primary truncate">
                            {card.title}
                          </h3>
                          <p className="text-xs text-text-secondary wrap-break-word">
                            {card.subtitle}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {variant === 'badges' && badges.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <Badge
                key={index}
                className={cn(
                  'flex items-center gap-2 border border-border/60 bg-background-secondary px-4 py-2 font-mono-accent text-sm text-text-primary transition-all duration-200 shadow-soft-sm',
                  badge.className
                )}
              >
                <Icon className="size-4" />
                <span className="font-semibold">{badge.value}</span>
                <span className="text-xs text-text-secondary">{badge.label}</span>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
