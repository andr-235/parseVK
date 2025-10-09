import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'
import { CARD_BORDER_BLUE, CARD_GRADIENT_BLUE, CARD_HOVER_EFFECT, BADGE_BLUE, TEXT_HINT } from './styles'

type StepCardProps = {
  stepNumber?: number
  title: string
  description: string
  hint?: ReactNode
  children?: ReactNode
  className?: string
}

function StepCard({ stepNumber, title, description, hint, children, className }: StepCardProps) {
  return (
    <Card className={cn(CARD_HOVER_EFFECT, CARD_BORDER_BLUE, CARD_GRADIENT_BLUE, className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {stepNumber && (
            <Badge variant="secondary" className={BADGE_BLUE}>
              Шаг {stepNumber}
            </Badge>
          )}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm leading-relaxed pt-2">{description}</CardDescription>
      </CardHeader>

      {(children || hint) && (
        <CardContent className="space-y-4">
          {children}
          {hint && <p className={cn('text-xs leading-relaxed', TEXT_HINT)}>{hint}</p>}
        </CardContent>
      )}
    </Card>
  )
}

export { StepCard }