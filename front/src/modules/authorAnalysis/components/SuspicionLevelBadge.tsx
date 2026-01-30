import { Badge } from '@/shared/ui/badge'
import type { SuspicionLevel } from '@/types'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'highlight'

interface SuspicionLevelBadgeProps {
  level: SuspicionLevel
  className?: string
}

const config: Record<SuspicionLevel, { label: string; variant: BadgeVariant }> = {
  NONE: { label: 'Не обнаружено', variant: 'secondary' },
  LOW: { label: 'Низкий', variant: 'outline' },
  MEDIUM: { label: 'Средний', variant: 'default' },
  HIGH: { label: 'Высокий', variant: 'destructive' },
}

export function SuspicionLevelBadge({ level, className }: SuspicionLevelBadgeProps) {
  const { label, variant } = config[level]

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
