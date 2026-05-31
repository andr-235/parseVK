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
  totalGroups,
  processedTotal,
  activeGroups,
  pendingGroups,
  successCount,
  failedCount,
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
    <div className="rounded-card border border-border/70 bg-background-primary/45 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-monitoring-body text-sm font-semibold text-text-primary">
            Прогресс выполнения
          </h3>
          <p className="mt-1 font-monitoring-body text-sm text-text-secondary">
            Обработано {processedTotal} из {totalGroups} групп
          </p>
        </div>
        <span className="font-mono-accent text-sm font-semibold text-text-light">
          {progressPercent}%
        </span>
      </div>
      <ProgressBar
        current={processedTotal}
        total={totalGroups}
        showLabel={false}
        tone={processedTotal >= totalGroups && totalGroups > 0 ? 'success' : 'primary'}
        className="mb-4 h-2"
      />

      <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <MetricItem key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </div>
  )
}
