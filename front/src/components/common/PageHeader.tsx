import { type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/common'
import { Globe, Terminal, FileSpreadsheet } from 'lucide-react'

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
  variant?: string // Игнорируем, так как теперь всегда console
  cards?: PageHeaderCardConfig[]
  badges?: PageHeaderBadgeConfig[]
  footer?: ReactNode
  className?: string
  colsClass?: string // default: "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
  // Новые опциональные параметры для метаданных экспорта
  platformLabel?: string
  platformColorClass?: string
  apiMethod?: string
  formatLabel?: string
}

export const PageHeader = ({
  title,
  description,
  actions,
  cards = [],
  badges = [],
  className,
  colsClass = 'grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  platformLabel,
  platformColorClass,
  apiMethod,
  formatLabel,
}: PageHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-8 w-full font-monitoring-body animate-in fade-in-0 duration-700',
        className
      )}
    >
      {/* Unified High-density Console Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-card border border-border/50 bg-background-secondary/90 shadow-soft-sm relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-transparent opacity-20" />

        <div className="relative space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2"></div>
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-text-light">
            {title}
          </h1>
          {description && (
            <p className="text-text-secondary max-w-3xl text-sm leading-relaxed font-monitoring-body">
              {description}
            </p>
          )}
        </div>

        {/* Dynamic Right Section: Metadata Tags or Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          {/* Render console-style platform metadata if provided */}
          {platformLabel && (
            <div className="flex items-center gap-2 border border-border/50 bg-background-primary px-3 py-2 rounded-lg font-mono-accent text-xs shadow-soft-sm">
              <Globe className="size-4 text-text-secondary" />
              <span className="text-text-secondary">Источник:</span>
              <span className={platformColorClass || 'text-accent-primary'}>{platformLabel}</span>
            </div>
          )}

          {apiMethod && (
            <div className="flex items-center gap-2 border border-border/50 bg-background-primary px-3 py-2 rounded-lg font-mono-accent text-xs shadow-soft-sm">
              <Terminal className="size-4 text-text-secondary" />
              <span className="text-text-secondary">Метод:</span>
              <span className="text-text-primary">{apiMethod}</span>
            </div>
          )}

          {formatLabel && (
            <div className="flex items-center gap-2 border border-border/50 bg-background-primary px-3 py-2 rounded-lg font-mono-accent text-xs shadow-soft-sm">
              <FileSpreadsheet className="size-4 text-text-secondary" />
              <span className="text-text-secondary">Формат:</span>
              <span className="text-accent-primary">{formatLabel}</span>
            </div>
          )}

          {/* Render standard actions */}
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>

      {/* Standardized Console Cards Grid */}
      {cards.length > 0 && (
        <div className={cn('grid', colsClass)}>
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={index}
                className="relative h-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-75"
              >
                <Card className="relative border border-border/50 bg-background-secondary/95 shadow-soft-sm p-5 overflow-hidden h-full">
                  <div className="relative flex items-start gap-3 h-full z-10">
                    <div className="p-2 rounded-lg shrink-0 bg-accent-primary/10 text-accent-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0 font-monitoring-body">
                      {card.customContent ? (
                        card.customContent
                      ) : (
                        <>
                          <h3 className="font-monitoring-body text-sm font-semibold text-text-primary truncate">
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

      {/* Standardized Badges Row */}
      {badges.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <Badge
                key={index}
                className={cn(
                  'flex items-center gap-2 border border-border/50 bg-background-secondary px-4 py-2 font-mono-accent text-sm text-text-primary transition-all duration-200 shadow-soft-sm',
                  badge.className
                )}
              >
                <Icon className="size-4 text-text-secondary" />
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
