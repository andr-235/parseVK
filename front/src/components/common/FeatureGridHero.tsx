import { type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/common'

export interface HeroCardConfig {
  icon: React.ComponentType<{ className?: string }>
  title: string | ReactNode
  subtitle: string
  bgGradientClass?: string // default: "from-cyan-500/20 to-blue-500/20"
  borderGradientClass?: string // default: "via-cyan-400/50"
  iconBgClass?: string // default: "bg-cyan-500/10"
  iconTextClass?: string // default: "text-cyan-400"
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
            <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>
          ) : (
            title
          )}
          {description && (
            <p className="text-slate-300 max-w-2xl text-lg">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className={cn('grid', colsClass)}>
        {cards.map((card, index) => {
          const Icon = card.icon
          const bgGradientClass = card.bgGradientClass || 'from-cyan-500/20 to-blue-500/20'
          const borderGradientClass = card.borderGradientClass || 'via-cyan-400/50'
          const iconBgClass = card.iconBgClass || 'bg-cyan-500/10'
          const iconTextClass = card.iconTextClass || 'text-cyan-400'

          return (
            <div key={index} className="relative">
              <div
                className={cn(
                  'absolute -inset-0.5 rounded-xl opacity-50 blur-lg transition-opacity duration-300 bg-gradient-to-r',
                  bgGradientClass
                )}
              />
              <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden h-full">
                <div
                  className={cn(
                    'absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
                    borderGradientClass
                  )}
                />
                <div className="flex items-start gap-3 h-full">
                  <div className={cn('p-2 rounded-lg shrink-0', iconBgClass, iconTextClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    {card.customContent ? (
                      card.customContent
                    ) : (
                      <>
                        <h3 className="font-monitoring-display text-sm font-semibold text-white truncate">
                          {card.title}
                        </h3>
                        <p className="text-xs text-slate-400 break-words">{card.subtitle}</p>
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
