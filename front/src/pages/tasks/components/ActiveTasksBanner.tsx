import ProgressBar from '@/components/common/ProgressBar'
import type { Task } from '@/shared/types'
import { useActiveTasksBanner } from '@/pages/tasks/hooks/useActiveTasksBanner'
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
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-monitoring-body text-base font-semibold text-text-primary">
              Активные процессы парсинга
            </CardTitle>
            <CardDescription className="font-monitoring-body text-sm font-normal text-text-secondary">
              {subtitle}
            </CardDescription>
          </div>
          {indicatorText && (
            <Badge
              variant="outline"
              className="gap-2 rounded-md border border-primary/20 bg-orange-950/20 text-primary font-monitoring-body text-xs font-semibold uppercase tracking-wider"
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              </span>
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
