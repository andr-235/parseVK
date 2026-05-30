import ProgressBar from '@/shared/components/common/ProgressBar'
import { MetricItem } from './MetricItem'

interface TaskProgressSectionProps {
  totalGroups: number
  processedTotal: number
  activeGroups: number
  pendingGroups: number
  successCount: number
  failedCount: number
}

export const TaskProgressSection = ({
  totalGroups, processedTotal, activeGroups, pendingGroups, successCount, failedCount,
}: TaskProgressSectionProps) => {
  if (totalGroups === 0) return null

  const progressPercent = Math.round(totalGroups > 0 ? (processedTotal / totalGroups) * 100 : 0)

  const metrics = [
    { label: 'В работе', value: activeGroups },
    { label: 'В очереди', value: pendingGroups },
    { label: 'Успешно', value: successCount ?? 0 },
    { label: 'Ошибок', value: failedCount ?? 0 },
  ]

  return (
    <div className="rounded-xl border border-border/50 bg-background-primary/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-monitoring-body text-sm font-semibold text-text-primary">Прогресс</span>
        <span className="font-mono-accent text-xs font-medium text-text-secondary">
          {processedTotal} / {totalGroups}
        </span>
      </div>
      <ProgressBar
        current={processedTotal}
        total={totalGroups}
        showLabel={false}
        tone={processedTotal >= totalGroups && totalGroups > 0 ? 'success' : 'primary'}
        className="h-2 mb-3"
      />
      <div className="font-mono-accent text-xs font-medium text-text-secondary mb-4">{progressPercent}%</div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/40">
        {metrics.map((m) => (
          <MetricItem key={m.label} label={m.label} value={m.value} />
        ))}
      </div>
    </div>
  )
}
