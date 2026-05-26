import { type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/common'

export interface HeroCardConfig {
  icon: React.ComponentType<{ className?: string }>
  title: string | ReactNode
  subtitle: string
  bgGradientClass?: string // default: "from-accent-primary/20 to-accent-info/20"
  borderGradientClass?: string // default: "via-accent-primary/50"
  iconBgClass?: string // default: "bg-accent-primary/10"
  iconTextClass?: string // default: "text-accent-primary"
  customContent?: ReactNode
}

interface FeatureGridHeroProps {
  title: string | ReactNode
  description?: string
  actions?: ReactNode
  cards: HeroCardConfig[]
  colsClass?: string // default: "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
}

export const FeatureGridHero = ({
  title,
  description,
  actions,
  cards,
  colsClass = 'grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
}: FeatureGridHeroProps) => {
  return (
    <div className="flex flex-col gap-8">
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
            <p className="text-text-secondary max-w-2xl text-lg">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className={cn('grid', colsClass)}>
        {cards.map((card, index) => {
          const Icon = card.icon
          const iconBgClass = card.iconBgClass || 'bg-accent-primary/10'
          const iconTextClass = card.iconTextClass || 'text-accent-primary'

          return (
            <div key={index} className="relative h-full">
              <Card className="relative border border-border/60 bg-background-secondary shadow-soft-sm p-5 overflow-hidden h-full">
                <div className="flex items-start gap-3 h-full">
                  <div className={cn('p-2 rounded-lg shrink-0', iconBgClass, iconTextClass)}>
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
                        <p className="text-xs text-text-secondary wrap-break-word">{card.subtitle}</p>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
