import ProgressBar from '@/shared/components/common/ProgressBar'
import type { Task } from '@/shared/types'
import { useActiveTasksBanner } from '@/pages/tasks/hooks/useActiveTasksBanner'
import { StatusBadge } from '@/shared/components/ui/status-badge'

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

  if (!shouldRender) return null

  const toneToBadge: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    primary: 'info',
    success: 'success',
    danger: 'danger',
  }

  return (
    <div className="border-b border-border/50 bg-background-secondary/50">
      <div className="flex flex-col gap-3 px-4 md:px-8 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-monitoring-body text-sm font-semibold text-text-primary">
              Активные процессы
            </span>
            {indicatorText && (
              <StatusBadge
                tone={toneToBadge[aggregatedTone] ?? 'info'}
                pulse
                className="text-xs leading-none"
              >
                {indicatorText}
              </StatusBadge>
            )}
          </div>
          <span className="font-monitoring-body text-xs text-text-secondary leading-relaxed">
            {subtitle}
          </span>
        </div>

        <ProgressBar
          current={processed}
          total={progressTotal}
          label={aggregatedLabel}
          showLabel
          tone={aggregatedTone}
          indeterminate={indeterminate}
        />
      </div>
    </div>
  )
}

export default ActiveTasksBanner
