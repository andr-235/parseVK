import { useMemo } from "react"

interface ProgressBarProps {
  current: number
  total: number
  label?: string
  showLabel?: boolean
  size?: 'default' | 'small'
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  indeterminate?: boolean
}

const clampPercentage = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 100) {
    return 100
  }

  return value
}

function ProgressBar({
  current,
  total,
  label,
  showLabel = true,
  size = 'default',
  tone = 'primary',
  className,
  indeterminate = false
}: ProgressBarProps) {
  const percentage = useMemo(() => {
    const safeTotal = total > 0 ? total : 0
    const safeCurrent = current > 0 ? current : 0
    return safeTotal > 0 ? clampPercentage((safeCurrent / safeTotal) * 100) : 0
  }, [current, total])

  const formattedLabel = useMemo(() => label ?? `${Math.round(percentage)}%`, [label, percentage])

  return (
    <div
      className={[
        'flex flex-col gap-2',
        size === 'small' ? 'text-xs' : 'text-sm',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'relative w-full overflow-hidden rounded-full bg-background-secondary/70',
          size === 'small' ? 'h-2.5' : 'h-3.5',
        ].join(' ')}
      >
        <div
          className={[
            'h-full rounded-full transition-all duration-300 ease-out',
            {
              primary: 'bg-accent-primary',
              success: 'bg-accent-success',
              warning: 'bg-accent-warning',
              danger: 'bg-accent-danger',
            }[tone],
            indeterminate ? 'w-1/3 animate-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="font-medium text-text-secondary">
          {formattedLabel}
        </div>
      )}
    </div>
  )
}

export default ProgressBar
