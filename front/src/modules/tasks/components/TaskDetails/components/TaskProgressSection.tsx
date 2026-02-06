import ProgressBar from '@/shared/components/ProgressBar'

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
  if (totalGroups === 0) {
    return null
  }

  const progressPercent = Math.round(totalGroups > 0 ? (processedTotal / totalGroups) * 100 : 0)

  return (
    <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Прогресс</span>
        <span className="text-sm font-medium text-muted-foreground">
          {processedTotal} / {totalGroups}
        </span>
      </div>
      <ProgressBar
        current={processedTotal}
        total={totalGroups}
        showLabel={false}
        tone={processedTotal >= totalGroups && totalGroups > 0 ? 'success' : 'primary'}
        className="h-2 mb-4"
      />
      <div className="text-xs font-medium text-muted-foreground mb-6">{progressPercent}%</div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            В работе
          </p>
          <p className="text-lg font-semibold text-foreground">{activeGroups}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            В очереди
          </p>
          <p className="text-lg font-semibold text-foreground">{pendingGroups}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Успешно
          </p>
          <p className="text-lg font-semibold text-foreground">{successCount ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Ошибок
          </p>
          <p className="text-lg font-semibold text-foreground">{failedCount ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
