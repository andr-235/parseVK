import ProgressBar from '@/shared/components/ProgressBar'
import type { Task } from '@/types'
import { useActiveTasksBanner } from '@/modules/tasks/hooks/useActiveTasksBanner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

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
    <div className="relative">
      {/* Glow Effect */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-50 blur-xl" />

      <Card className="relative overflow-hidden border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-2xl">
        {/* Top Border Glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <CardTitle className="font-monitoring-display text-xl text-white">
                Активные процессы парсинга
              </CardTitle>
              <CardDescription className="text-slate-400">{subtitle}</CardDescription>
            </div>
            {indicatorText && (
              <Badge
                variant="outline"
                className="gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-400 font-mono-accent"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
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

        {/* Bottom Accent Line */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50" />
      </Card>
    </div>
  )
}

export default ActiveTasksBanner
