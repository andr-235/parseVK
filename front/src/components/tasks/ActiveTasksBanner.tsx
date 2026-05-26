import ProgressBar from '@/components/common/ProgressBar'
import type { Task } from '@/types'
import { useActiveTasksBanner } from '@/hooks/tasks/useActiveTasksBanner'
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
            <CardTitle className="font-monitoring-display text-lg text-foreground">
              Активные процессы парсинга
            </CardTitle>
            <CardDescription className="text-muted-foreground">{subtitle}</CardDescription>
          </div>
          {indicatorText && (
            <Badge
              variant="outline"
              className="gap-2 rounded-md border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 font-mono-accent"
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
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
