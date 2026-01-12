import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
  useCard?: boolean
}

export function LoadingState({
  message = 'Загрузка...',
  className,
  useCard = false,
}: LoadingStateProps) {
  const content = (
    <div
      className={cn(
        'flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-background-secondary/60 p-10 text-center text-text-secondary shadow-soft-sm md:p-12',
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="h-12 w-12" />
      <p className="font-semibold text-text-primary">{message}</p>
    </div>
  )

  if (useCard) {
    return (
      <Card className="border-0" aria-live="polite" aria-busy="true">
        <div
          className={cn(
            'flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-background-secondary/60 p-10 text-center text-text-secondary shadow-soft-sm md:p-12',
            className
          )}
        >
          <Spinner className="h-12 w-12" />
          <p className="font-semibold text-text-primary">{message}</p>
        </div>
      </Card>
    )
  }

  return content
}
