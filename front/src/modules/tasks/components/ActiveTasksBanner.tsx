import ProgressBar from '@/components/ProgressBar'
import type { Task } from '@/types'
import { useActiveTasksBanner } from '@/modules/tasks/hooks/useActiveTasksBanner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ActiveTasksBannerProps {
  tasks: Task[]
  isCreating: boolean
}

function ActiveTasksBanner({ tasks, isCreating }: ActiveTasksBannerProps) {
  const {
    shouldRender,
    subtitle,
    aggregatedLabel,
    indicatorText,
    progressTotal,
    processed,
    aggregatedTone,
    indeterminate,
  } = useActiveTasksBanner(tasks, isCreating)

  if (!shouldRender) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">Активные процессы парсинга</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          {indicatorText && (
            <Badge
              variant="outline"
              className="gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary"
            >
              <span
                className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-primary"
                aria-hidden
              />
              {indicatorText}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <ProgressBar
          current={processed}
          total={progressTotal}
          label={aggregatedLabel}
          showLabel
          tone={aggregatedTone}
          indeterminate={indeterminate}
        />
      </CardContent>
    </Card>
  )
}

export default ActiveTasksBanner
